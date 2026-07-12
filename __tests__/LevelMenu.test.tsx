/**
 * Tests for LevelMenu: grouping, solved/unsolved rendering, and
 * puzzle selection.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LevelMenu from '@/src/components/LevelMenu';
import {
   getAllPuzzles,
   getAllPuzzlesSolvedForDevice,
   resetAllPuzzleProgress,
} from '@/services/puzzleService';
import { setResumeLevel } from '@/services/resumeLevelService';
import { showAlert } from '@/src/utils/alert';

jest.mock('@/services/puzzleService', () => ({
   getAllPuzzles: jest.fn(),
   getAllPuzzlesSolvedForDevice: jest.fn(),
   resetAllPuzzleProgress: jest.fn(),
}));

jest.mock('@/services/resumeLevelService', () => ({
   setResumeLevel: jest.fn(),
}));

jest.mock('@/src/utils/alert', () => ({
   showAlert: jest.fn(),
}));

const mockGetAllPuzzles = getAllPuzzles as jest.Mock;
const mockGetAllProgress = getAllPuzzlesSolvedForDevice as jest.Mock;
const mockResetAllPuzzleProgress = resetAllPuzzleProgress as jest.Mock;
const mockSetResumeLevel = setResumeLevel as jest.Mock;
const mockShowAlert = showAlert as jest.Mock;

const PUZZLES = [
   { id: 'p1', level_number: 1, image_url: 'https://example.com/1.png', grid_size: 3 },
   { id: 'p2', level_number: 2, image_url: 'https://example.com/2.png', grid_size: 3 },
   { id: 'p3', level_number: 3, image_url: 'https://example.com/3.png', grid_size: 4 },
];

describe('LevelMenu', () => {
   beforeEach(() => {
      jest.clearAllMocks();
   });

   it('groups puzzles by grid size, sorted ascending', async () => {
      mockGetAllPuzzles.mockResolvedValue(PUZZLES);
      mockGetAllProgress.mockResolvedValue([]);

      const { getByText } = render(
         <LevelMenu deviceId="device-1" onPuzzleSelected={jest.fn()} />
      );

      await waitFor(() => {
         expect(getByText('3\u00d73')).toBeTruthy();
         expect(getByText('4\u00d74')).toBeTruthy();
      });
   });

   it('shows a "?" placeholder for unsolved puzzles', async () => {
      mockGetAllPuzzles.mockResolvedValue(PUZZLES);
      mockGetAllProgress.mockResolvedValue([]);

      const { findAllByText } = render(
         <LevelMenu deviceId="device-1" onPuzzleSelected={jest.fn()} />
      );

      const placeholders = await findAllByText('?');
      expect(placeholders).toHaveLength(PUZZLES.length);
   });

   it('does not show a "?" placeholder for solved puzzles', async () => {
      mockGetAllPuzzles.mockResolvedValue(PUZZLES);
      mockGetAllProgress.mockResolvedValue([
         { puzzle_id: 'p1', solved: true },
         { puzzle_id: 'p2', solved: false },
         { puzzle_id: 'p3', solved: false },
      ]);

      const { findAllByText } = render(
         <LevelMenu deviceId="device-1" onPuzzleSelected={jest.fn()} />
      );

      const placeholders = await findAllByText('?');
      expect(placeholders).toHaveLength(PUZZLES.length - 1);
   });

   it('calls onPuzzleSelected with the correct level when a puzzle is tapped', async () => {
      mockGetAllPuzzles.mockResolvedValue(PUZZLES);
      mockGetAllProgress.mockResolvedValue([]);

      const onPuzzleSelected = jest.fn();
      const { findAllByText } = render(
         <LevelMenu deviceId="device-1" onPuzzleSelected={onPuzzleSelected} />
      );

      const placeholders = await findAllByText('?');
      fireEvent.press(placeholders[0]);

      expect(onPuzzleSelected).toHaveBeenCalledTimes(1);
      expect(onPuzzleSelected).toHaveBeenCalledWith(expect.any(Number));
   });

   it('fetches puzzles and progress using the given deviceId', async () => {
      mockGetAllPuzzles.mockResolvedValue([]);
      mockGetAllProgress.mockResolvedValue([]);

      render(<LevelMenu deviceId="device-42" onPuzzleSelected={jest.fn()} />);

      await waitFor(() => {
         expect(mockGetAllPuzzles).toHaveBeenCalledTimes(1);
         expect(mockGetAllProgress).toHaveBeenCalledWith('device-42');
      });
   });

   describe('Reset All Puzzles button', () => {
      it('resets progress, resets the resume level, selects level 1, and refreshes the menu', async () => {
         mockGetAllPuzzles.mockResolvedValue(PUZZLES);
         mockGetAllProgress
            .mockResolvedValueOnce([{ puzzle_id: 'p1', solved: true }]) // initial load
            .mockResolvedValueOnce([]); // post-reset refresh
         mockResetAllPuzzleProgress.mockResolvedValue(undefined);
         mockSetResumeLevel.mockResolvedValue(undefined);

         const onPuzzleSelected = jest.fn();
         const { getByText, findAllByText } = render(
            <LevelMenu deviceId="device-1" onPuzzleSelected={onPuzzleSelected} />
         );

         // Wait for the initial load so the solved thumbnail is up before reset.
         await waitFor(() => {
            expect(mockGetAllPuzzles).toHaveBeenCalledTimes(1);
         });

         fireEvent.press(getByText('Reset All Puzzles'));

         await waitFor(() => {
            expect(mockResetAllPuzzleProgress).toHaveBeenCalledWith('device-1');
            expect(mockSetResumeLevel).toHaveBeenCalledWith(1);
            expect(onPuzzleSelected).toHaveBeenCalledWith(1);
         });

         // loadGroups should have re-run: puzzles/progress fetched a second time.
         await waitFor(() => {
            expect(mockGetAllPuzzles).toHaveBeenCalledTimes(2);
            expect(mockGetAllProgress).toHaveBeenCalledTimes(2);
         });

         // Menu should now reflect every puzzle as unsolved.
         const placeholders = await findAllByText('?');
         expect(placeholders).toHaveLength(PUZZLES.length);
      });

      it('shows an alert and does not reset the level if resetting progress fails', async () => {
         mockGetAllPuzzles.mockResolvedValue(PUZZLES);
         mockGetAllProgress.mockResolvedValue([]);
         mockResetAllPuzzleProgress.mockRejectedValue(new Error('network error'));

         const onPuzzleSelected = jest.fn();
         const { getByText } = render(
            <LevelMenu deviceId="device-1" onPuzzleSelected={onPuzzleSelected} />
         );

         await waitFor(() => {
            expect(mockGetAllPuzzles).toHaveBeenCalledTimes(1);
         });

         fireEvent.press(getByText('Reset All Puzzles'));

         await waitFor(() => {
            expect(mockShowAlert).toHaveBeenCalledWith(
               'Something went wrong',
               'Could not reset progress'
            );
         });

         expect(mockSetResumeLevel).not.toHaveBeenCalled();
         expect(onPuzzleSelected).not.toHaveBeenCalled();
      });
   });
});