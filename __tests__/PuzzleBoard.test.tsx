import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PuzzleBoard from '@/components/PuzzleBoard';
import { Board } from '@/utils/puzzleUtils';
import { PuzzleImage } from '@/utils/imageUtils';

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

jest.mock('react-native-gesture-handler', () => ({
   Gesture: {
      Pan:       jest.fn(() => ({ onStart: jest.fn().mockReturnThis(), onUpdate: jest.fn().mockReturnThis(), onEnd: jest.fn().mockReturnThis(), enabled: jest.fn().mockReturnThis() })),
      Tap:       jest.fn(() => ({ onEnd: jest.fn().mockReturnThis(), enabled: jest.fn().mockReturnThis() })),
      Exclusive: jest.fn((pan, tap) => ({ pan, tap })),
   },
   GestureDetector:  ({ children }: any) => children,
   ComposedGesture:  {},
   GestureType:      {},
   PanGesture:       {},
}));

// Mock shuffle to return a known state for predictable tests
// Swaps tile 0 and tile 1 so we know exactly what needs fixing
jest.mock('@/utils/puzzleUtils', () => ({
   ...jest.requireActual('@/utils/puzzleUtils'),
   shuffle: jest.fn((tiles: number[]) => {
      const arr = [...tiles];
      [arr[0], arr[1]] = [arr[1], arr[0]];
      return arr;
   }),
}));

const mockImage: PuzzleImage = {
   uri:    'https://res.cloudinary.com/scrambled/image/upload/v1778374693/otter_unszkv.png',
   desc:   'An otter',
   width:  400,
   height: 400,
   };

const mockBoard: Board = {
   N:               3,
   boardWidth:      300,
   boardHeight:     300,
   tileWidth:       100,
   tileHeight:      100,
   tileBorderWidth: 1,
};

const defaultProps = {
   level:          1,
   image:          mockImage,
   board:          mockBoard,
   gridSize:       3,
   onPuzzleSolved: jest.fn(),
};

describe('tapping two adjacent tiles swaps them', () => {

   it('swaps two tiles when clicked', () => {
      const { getByTestId } = render(<PuzzleBoard {...defaultProps} />);
      fireEvent.press(getByTestId('tile-0'));
      fireEvent.press(getByTestId('tile-1'));
      expect(getByTestId('tile-0')).toBeTruthy();
   });

   it('does not swap non-adjacent tiles', () => {
      const { getByTestId } = render(<PuzzleBoard {...defaultProps} />);
      fireEvent.press(getByTestId('tile-0'));
      fireEvent.press(getByTestId('tile-8'));
      expect(getByTestId('tile-8')).toBeTruthy();
   });

});

describe('dragging a tile onto an adjacent tile swaps them', () => {

   it('swaps two tiles when dragged', () => {
      const { getByTestId } = render(<PuzzleBoard {...defaultProps} />);
      const tile = getByTestId('tile-0');
      fireEvent(tile, 'responderGrant',   { nativeEvent: { locationX: 50, locationY: 50 } });
      fireEvent(tile, 'responderMove',    { nativeEvent: { locationX: 150, locationY: 50 } });
      fireEvent(tile, 'responderRelease', { nativeEvent: { locationX: 150, locationY: 50 } });
      expect(getByTestId('tile-0')).toBeTruthy();
   });

   it('does not swap when dragged onto a non-adjacent tile', () => {
      const { getByTestId } = render(<PuzzleBoard {...defaultProps} />);
      const tile = getByTestId('tile-0');
      fireEvent(tile, 'responderGrant',   { nativeEvent: { locationX: 50,  locationY: 50  } });
      fireEvent(tile, 'responderMove',    { nativeEvent: { locationX: 250, locationY: 250 } });
      fireEvent(tile, 'responderRelease', { nativeEvent: { locationX: 250, locationY: 250 } });
      expect(getByTestId('tile-0')).toBeTruthy();
   });

   it('shows ghost tile while dragging', () => {
      const { getByTestId } = render(<PuzzleBoard {...defaultProps} />);
      const tile = getByTestId('tile-0');
      fireEvent(tile, 'responderGrant', { nativeEvent: { locationX: 50,  locationY: 50 } });
      fireEvent(tile, 'responderMove',  { nativeEvent: { locationX: 100, locationY: 50 } });
      expect(getByTestId('ghost-tile')).toBeTruthy();
   });

});