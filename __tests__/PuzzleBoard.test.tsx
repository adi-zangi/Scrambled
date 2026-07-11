/**
 * Tests for PuzzleBoard tap-to-swap and drag-to-swap interactions.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PuzzleBoard from '@/src/components/PuzzleBoard';
import { Board, tileX, tileY } from '@/src/utils/puzzleUtils';
import { Puzzle } from '@/src/types/puzzle';

jest.mock('react-native-worklets', () => ({
   runOnJS:            jest.fn((fn) => fn),
   createSerializable: jest.fn((val) => val),
   isWorklet:          jest.fn(() => false),
}));

jest.mock('react-native-reanimated', () => {
   const RN = require('react-native');
   return {
      useSharedValue:          jest.fn((val) => ({ value: val })),
      useAnimatedStyle:        jest.fn(() => ({})),
      withSpring:              jest.fn((val) => val),
      withTiming:              jest.fn((val) => val),
      runOnJS:                 jest.fn((fn) => fn),
      createAnimatedComponent: jest.fn((component) => component),
      View:                    RN.View,
      Image:                   RN.Image,
      default: {
         useSharedValue:          jest.fn((val) => ({ value: val })),
         useAnimatedStyle:        jest.fn(() => ({})),
         withSpring:              jest.fn((val) => val),
         withTiming:              jest.fn((val) => val),
         runOnJS:                 jest.fn((fn) => fn),
         createAnimatedComponent: jest.fn((component) => component),
         View:                    RN.View,
         Image:                   RN.Image,
      },
   };
});

jest.mock('react-native-gesture-handler', () => {
   const React = require('react');
   return {
      Gesture: {
         Pan: jest.fn(() => {
            const g: any = {};
            g.onStart  = jest.fn((cb) => { g._onStart = cb; return g; });
            g.onUpdate = jest.fn((cb) => { g._onUpdate = cb; return g; });
            g.onEnd    = jest.fn((cb) => { g._onEnd = cb; return g; });
            g.enabled  = jest.fn(() => g);
            return g;
         }),
         Tap: jest.fn(() => {
            const g: any = {};
            g.onEnd   = jest.fn((cb) => { g._onEnd = cb; return g; });
            g.enabled = jest.fn(() => g);
            return g;
         }),
         Exclusive: jest.fn((pan, tap) => ({ pan, tap })),
      },
      GestureDetector: ({ children, gesture }: any) => {
         const tap = gesture?.tap;
         const pan = gesture?.pan;
         return React.cloneElement(children, {
            onStartShouldSetResponder: () => true,
            onResponderGrant:   (e: any) => { pan?._onStart?.(); },
            onResponderMove:    (e: any) => { pan?._onUpdate?.(e.nativeEvent); },
            onResponderRelease: (e: any) => {
               if (e?.nativeEvent?.locationX !== undefined) {
                  pan?._onEnd?.(e.nativeEvent);
               } else {
                  tap?._onEnd?.();
               }
            },
         });
      },
      ComposedGesture: {},
      GestureType:     {},
      PanGesture:      {},
   };
});

jest.mock('expo-image', () => {
   const RN = require('react-native');
   return {
      Image: RN.Image,
   };
});

// Mock shuffle to return a known state for predictable tests.
// Grid layout:
//   0 1 2
//   3 4 5
//   6 7 8
// Swaps each adjacent pair (0-1, 3-4, 6-7) so every tile has a
// known neighbour it can be swapped back with.
jest.mock('@/src/utils/puzzleUtils', () => ({
   ...jest.requireActual('@/src/utils/puzzleUtils'),
   shuffle: jest.fn((tiles: number[]) => {
      const arr = [...tiles];
      [arr[0], arr[1]] = [arr[1], arr[0]];
      [arr[3], arr[4]] = [arr[4], arr[3]];
      [arr[6], arr[7]] = [arr[7], arr[6]];
      return arr;
   }),
}));

// No saved progress, so PuzzleBoard always falls back to the (mocked) shuffle above.
jest.mock('@/services/puzzleService', () => ({
   getPuzzleProgress:  jest.fn(() => Promise.resolve(null)),
   markPuzzleSolved:   jest.fn(() => Promise.resolve()),
   savePuzzleProgress: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/services/deviceService', () => ({
   getDeviceId: jest.fn(() => Promise.resolve('test-device-id')),
}));

// First puzzle from puzzles.csv (level 1 - fruit)
const mockPuzzle: Puzzle = {
   id:                  '1',
   level_number:        1,
   image_url:           'https://res.cloudinary.com/scrambled/image/upload/v1780122986/fruit_a235po.jpg',
   image_width:         4000,
   image_height:        6000,
   grid_size:           3,
   completion_message:  "You're one in a melon!",
};

const mockBoard: Board = {
   gridSize:        3,
   boardWidth:      300,
   boardHeight:     300,
   tileWidth:       100,
   tileHeight:      100,
   tileBorderWidth: 1,
};

const N        = 3;
const allTiles = Array.from({ length: N * N }, (_, i) => i); // [0..8]

// Adjacent pairs that our shuffle swapped — dragging these back restores order
const swappedPairs: [number, number][] = [[0, 1], [3, 4], [6, 7]];

// Non-adjacent pairs (diagonal or two steps away)
const nonAdjacentPairs: [number, number][] = [[0, 4], [0, 8], [2, 6], [1, 7], [3, 5]];

const defaultProps = {
   puzzle:         mockPuzzle,
   board:          mockBoard,
   deviceId:       'test-device-id',
   onPuzzleSolved: jest.fn(),
};

// Returns the expected image offset style for a given tile value
const expectedImageOffset = (tileVal: number) => ({
   left: -tileX(tileVal, mockBoard),
   top:  -tileY(tileVal, mockBoard),
});

// Finds the Image child inside a tile, which carries the image offset style
const getTileImage = (getByTestId: any, tileIndex: number) =>
   getByTestId(`tile-${tileIndex}`).findAll((node: any) => node.type === 'Image')[0];

// Returns the first style object from the Image child's style array
const getTileImageStyle = (getByTestId: any, tileIndex: number) =>
   getTileImage(getByTestId, tileIndex).props.style[0];

// Simulates a tap on a tile
const tap = (getByTestId: any, tileIndex: number) =>
   fireEvent(getByTestId(`tile-${tileIndex}`), 'responderRelease', { nativeEvent: {} });

// Simulates a drag from tile a to tile b
const drag = (getByTestId: any, a: number, b: number) => {
   const tile   = getByTestId(`tile-${a}`);
   const startX = tileX(a, mockBoard) + mockBoard.tileWidth  / 2;
   const startY = tileY(a, mockBoard) + mockBoard.tileHeight / 2;
   const endX   = tileX(b, mockBoard) + mockBoard.tileWidth  / 2;
   const endY   = tileY(b, mockBoard) + mockBoard.tileHeight / 2;
   fireEvent(tile, 'responderGrant',   { nativeEvent: { locationX: startX,        locationY: startY        } });
   fireEvent(tile, 'responderMove',    { nativeEvent: { translationX: endX - startX, translationY: endY - startY } });
   fireEvent(tile, 'responderRelease', { nativeEvent: { locationX: endX, locationY: endY, translationX: endX - startX, translationY: endY - startY } });
};

// Renders the board and waits for the async progress load to finish, so
// tiles are actually present before a test starts interacting with them.
const renderBoard = async (overrides: Partial<typeof defaultProps> = {}) => {
   const utils = render(<PuzzleBoard {...defaultProps} {...overrides} />);
   await waitFor(() => expect(utils.getByTestId('tile-0')).toBeTruthy());
   return utils;
};

describe('all tiles render', () => {

   it('renders every tile', async () => {
      const { getByTestId } = await renderBoard();
      allTiles.forEach((i) => {
         expect(getByTestId(`tile-${i}`)).toBeTruthy();
      });
   });

});

describe('tapping two adjacent tiles swaps them', () => {

   swappedPairs.forEach(([a, b]) => {
      it(`swaps tile-${a} and tile-${b}`, async () => {
         const { getByTestId } = await renderBoard();

         // Before swap: position a holds value b (shuffled)
         expect(getTileImageStyle(getByTestId, a)).toMatchObject(
            expectedImageOffset(b)
         );

         tap(getByTestId, a);
         tap(getByTestId, b);

         // After swap: position a should hold value a again
         expect(getTileImageStyle(getByTestId, a)).toMatchObject(
            expectedImageOffset(a)
         );
      });
   });

});

describe('tapping two non-adjacent tiles swaps them', () => {

   nonAdjacentPairs.forEach(([a, b]) => {
      it(`swaps tile-${a} and tile-${b}`, async () => {
         const { getByTestId } = await renderBoard();

         const valueAtB = getTileImage(getByTestId, b).props.style[0];

         tap(getByTestId, a);
         tap(getByTestId, b);

         // After swap: position a should hold whatever value was at b
         expect(getTileImageStyle(getByTestId, a)).toEqual(valueAtB);
      });
   });

});

describe('dragging a tile onto an adjacent tile swaps them', () => {

   swappedPairs.forEach(([a, b]) => {
      it(`drags tile-${a} onto tile-${b} and swaps them`, async () => {
         const { getByTestId } = await renderBoard();

         // Before swap: position a holds value b (shuffled)
         expect(getTileImageStyle(getByTestId, a)).toMatchObject(
            expectedImageOffset(b)
         );

         drag(getByTestId, a, b);

         // After drag: position a should hold value a again
         expect(getTileImageStyle(getByTestId, a)).toMatchObject(
            expectedImageOffset(a)
         );
      });
   });

});

describe('dragging a tile onto a non-adjacent tile swaps them', () => {

   nonAdjacentPairs.forEach(([a, b]) => {
      it(`dragging tile-${a} onto tile-${b} swaps them`, async () => {
         const { getByTestId } = await renderBoard();

         const valueAtB = getTileImage(getByTestId, b).props.style[0];

         drag(getByTestId, a, b);

         expect(getTileImageStyle(getByTestId, a)).toEqual(valueAtB);
      });
   });

});

describe('puzzle is locked after being solved', () => {

   it('does not allow a tap swap after the puzzle is solved', async () => {
      const onPuzzleSolved = jest.fn();
      const { getByTestId } = await renderBoard({ onPuzzleSolved });

      // Solve the puzzle by swapping all shuffled pairs back
      swappedPairs.forEach(([a, b]) => {
         tap(getByTestId, a);
         tap(getByTestId, b);
      });

      expect(onPuzzleSolved).toHaveBeenCalledTimes(1);

      // Try to swap a pair that is now in the solved position
      const [a, b] = swappedPairs[0];
      const styleAfterSolve = getTileImageStyle(getByTestId, a);
      tap(getByTestId, a);
      tap(getByTestId, b);

      expect(getTileImageStyle(getByTestId, a)).toEqual(styleAfterSolve);
   });

   it('does not allow a drag swap after the puzzle is solved', async () => {
      const onPuzzleSolved = jest.fn();
      const { getByTestId } = await renderBoard({ onPuzzleSolved });

      // Solve the puzzle by dragging all shuffled pairs back
      swappedPairs.forEach(([a, b]) => {
         drag(getByTestId, a, b);
      });

      expect(onPuzzleSolved).toHaveBeenCalledTimes(1);

      // Try to drag a pair that is now in the solved position
      const [a, b] = swappedPairs[0];
      const styleAfterSolve = getTileImageStyle(getByTestId, a);
      drag(getByTestId, a, b);

      expect(getTileImageStyle(getByTestId, a)).toEqual(styleAfterSolve);
   });

});

describe('ghost tile', () => {

   allTiles.forEach((i) => {
      it(`shows ghost tile while dragging tile-${i}`, async () => {
         const { getByTestId } = await renderBoard();
         const tile = getByTestId(`tile-${i}`);

         fireEvent(tile, 'responderGrant', { nativeEvent: { locationX: tileX(i, mockBoard) + 50, locationY: tileY(i, mockBoard) + 50 } });
         fireEvent(tile, 'responderMove',  { nativeEvent: { locationX: tileX(i, mockBoard) + 60, locationY: tileY(i, mockBoard) + 50 } });

         expect(getByTestId('ghost-tile')).toBeTruthy();
      });
   });

});