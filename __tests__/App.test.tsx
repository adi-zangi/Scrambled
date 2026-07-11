/**
 * Tests for App: puzzle selection flow and completion message display.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import App from '@/src/components/App';
import {
   getPuzzle,
   getPuzzleSolved,
   getAllPuzzles,
   getAllPuzzleProgressForDevice,
   getAllPuzzlesSolvedForDevice,
} from '@/services/puzzleService';
import { getDeviceId } from '@/services/deviceService';
import { getResumeLevel } from '@/services/resumeLevelService';

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
      GestureHandlerRootView: ({ children }: any) => children,
   };
});

jest.mock('@/services/puzzleService', () => ({
   getPuzzle: jest.fn(),
   getPuzzleSolved: jest.fn(),
   getAllPuzzles: jest.fn(),
   getAllPuzzleProgressForDevice: jest.fn(),
   // Used internally by PuzzleBoard, which App renders
   getPuzzleProgress: jest.fn(() => Promise.resolve(null)),
   markPuzzleSolved: jest.fn(() => Promise.resolve()),
   savePuzzleProgress: jest.fn(() => Promise.resolve()),
   getAllPuzzlesSolvedForDevice: jest.fn(),
}));

jest.mock('@/services/deviceService', () => ({
   getDeviceId: jest.fn(),
}));

jest.mock('@/services/resumeLevelService', () => ({
   getResumeLevel: jest.fn(),
   setResumeLevel: jest.fn(() => Promise.resolve()),
}));

const mockGetPuzzle = getPuzzle as jest.Mock;
const mockGetPuzzleSolved = getPuzzleSolved as jest.Mock;
const mockGetAllPuzzles = getAllPuzzles as jest.Mock;
const mockGetAllProgress = getAllPuzzleProgressForDevice as jest.Mock;
const mockGetAllSolved   = getAllPuzzlesSolvedForDevice as jest.Mock;
const mockGetDeviceId = getDeviceId as jest.Mock;
const mockGetResumeLevel = getResumeLevel as jest.Mock;

const LEVEL_1_PUZZLE = {
   id: 'p1',
   level_number: 1,
   image_url: 'https://example.com/1.png',
   image_width: 100,
   image_height: 100,
   grid_size: 3,
   completion_message: 'Great job on your first puzzle!',
};

const LEVEL_2_PUZZLE = {
   id: 'p2',
   level_number: 2,
   image_url: 'https://example.com/2.png',
   image_width: 100,
   image_height: 100,
   grid_size: 3,
   completion_message: 'Nice work on level 2!',
};

// Renders App and waits for PuzzleBoard's own async init (getPuzzleProgress)
// to settle, so later interactions aren't racing against it outside act().
const renderApp = async () => {
   const utils = render(<App />);
   await waitFor(() => expect(utils.getByTestId('tile-0')).toBeTruthy());
   return utils;
};

// Opens the level menu and taps the tile for the given level.
async function openMenuAndSelectLevel(level: number, findByText: any, findByLabelText: any) {
   const menuBtn = await findByText(/Level/);
   fireEvent.press(menuBtn);

   const tile = await findByLabelText(`Level ${level}`);
   await act(async () => {
      fireEvent.press(tile);
   });
}

describe('App', () => {
   beforeEach(() => {
      jest.clearAllMocks();
      mockGetAllSolved.mockResolvedValue([]);
      mockGetDeviceId.mockResolvedValue('device-1');
      mockGetResumeLevel.mockResolvedValue(null);
      mockGetAllPuzzles.mockResolvedValue([LEVEL_1_PUZZLE, LEVEL_2_PUZZLE]);
   });

   it('shows the completion message when a solved level 1 puzzle is selected from the menu', async () => {
      mockGetAllProgress.mockResolvedValue([{ puzzle_id: 'p1', solved: true }]);
      mockGetPuzzle.mockResolvedValue(LEVEL_1_PUZZLE);
      mockGetPuzzleSolved.mockResolvedValue(true);

      const { findByText, findByLabelText, getByText } = await renderApp();

      await openMenuAndSelectLevel(1, findByText, findByLabelText);

      await waitFor(() => {
         expect(getByText(LEVEL_1_PUZZLE.completion_message)).toBeTruthy();
      });
   });

   it('does not show the completion message for an unsolved level 1 puzzle, but still shows the how-to-play text', async () => {
      mockGetAllProgress.mockResolvedValue([{ puzzle_id: 'p1', solved: false }]);
      mockGetPuzzle.mockResolvedValue(LEVEL_1_PUZZLE);
      mockGetPuzzleSolved.mockResolvedValue(false);

      const { findByText, findByLabelText, queryByText, getByText } = await renderApp();

      await openMenuAndSelectLevel(1, findByText, findByLabelText);

      await waitFor(() => {
         expect(getByText('How to play')).toBeTruthy();
      });
      expect(queryByText(LEVEL_1_PUZZLE.completion_message)).toBeNull();
   });

   it('shows the completion message when a solved level 2 puzzle is selected from the menu', async () => {
      mockGetAllProgress.mockResolvedValue([{ puzzle_id: 'p2', solved: true }]);
      mockGetPuzzle.mockResolvedValue(LEVEL_2_PUZZLE);
      mockGetPuzzleSolved.mockResolvedValue(true);

      const { findByText, findByLabelText, getByText } = await renderApp();

      await openMenuAndSelectLevel(2, findByText, findByLabelText);

      await waitFor(() => {
         expect(getByText(LEVEL_2_PUZZLE.completion_message)).toBeTruthy();
      });
   });

   it('shows nothing in the message bar for an unsolved level 2 puzzle', async () => {
      mockGetAllProgress.mockResolvedValue([{ puzzle_id: 'p2', solved: false }]);
      mockGetPuzzle.mockResolvedValue(LEVEL_2_PUZZLE);
      mockGetPuzzleSolved.mockResolvedValue(false);

      const { findByText, findByLabelText, queryByText } = await renderApp();

      await openMenuAndSelectLevel(2, findByText, findByLabelText);

      await waitFor(() => {
         expect(queryByText(LEVEL_2_PUZZLE.completion_message)).toBeNull();
      });
      expect(queryByText('How to play')).toBeNull();
   });

   it('does not show the previous puzzle\'s completion message while the next puzzle\'s solved status is loading', async () => {
      // Start on a solved level 1
      mockGetAllProgress.mockResolvedValue([
         { puzzle_id: 'p1', solved: true },
         { puzzle_id: 'p2', solved: false },
      ]);
      mockGetPuzzle.mockResolvedValueOnce(LEVEL_1_PUZZLE);
      mockGetPuzzleSolved.mockResolvedValueOnce(true);

      const { findByText, findByLabelText, getByText, queryByText } = await renderApp();

      // Confirm level 1's completion message is showing before we navigate away
      await waitFor(() => {
         expect(getByText(LEVEL_1_PUZZLE.completion_message)).toBeTruthy();
      });

      // Set up level 2 as the next puzzle, but hold its solved-status fetch
      // open so we can inspect state before it resolves.
      mockGetPuzzle.mockResolvedValueOnce(LEVEL_2_PUZZLE);
      let resolveSolved: (value: boolean) => void;
      const solvedPromise = new Promise<boolean>((resolve) => {
         resolveSolved = resolve;
      });
      mockGetPuzzleSolved.mockReturnValueOnce(solvedPromise);

      await openMenuAndSelectLevel(2, findByText, findByLabelText);

      // At this point, puzzle has switched to level 2 but getPuzzleSolved
      // for level 2 hasn't resolved yet. The stale level 1 completion
      // message must not still be showing.
      expect(queryByText(LEVEL_1_PUZZLE.completion_message)).toBeNull();
      expect(queryByText(LEVEL_2_PUZZLE.completion_message)).toBeNull();

      // Let the pending fetch resolve and confirm the final state is correct
      await act(async () => {
         resolveSolved!(false);
      });
      await waitFor(() => {
         expect(queryByText(LEVEL_2_PUZZLE.completion_message)).toBeNull();
      });
   });
});