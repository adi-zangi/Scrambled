/**
 * Tests for LevelMenu: grouping, solved/unsolved rendering, and
 * puzzle selection.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LevelMenu from '@/src/components/LevelMenu';
import { getAllPuzzles, getAllPuzzleProgressForDevice } from '@/services/puzzleService';

jest.mock('@/services/puzzleService', () => ({
   getAllPuzzles: jest.fn(),
   getAllPuzzleProgressForDevice: jest.fn(),
}));

const mockGetAllPuzzles = getAllPuzzles as jest.Mock;
const mockGetAllProgress = getAllPuzzleProgressForDevice as jest.Mock;

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
});