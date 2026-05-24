/**
 * puzzleService.ts
 *
 * Data access functions for the puzzles table in Supabase.
 * All database queries for puzzle data should go through this service.
 */

import { createClient } from '@supabase/supabase-js';
import { Puzzle } from '../src/types/puzzle';
import Constants from 'expo-constants';

const supabase = createClient(
   Constants.expoConfig?.extra?.supabaseUrl,
   Constants.expoConfig?.extra?.supabaseServiceRoleKey
);

/**
 * Fetches all data for a puzzle at the given level number.
 */
const getPuzzle = async (level: number): Promise<Puzzle> => {
   const { data, error } = await supabase
      .from('puzzles')
      .select('*')
      .eq('level_number', level)
      .single();

   if (error) {
      throw new Error(`Failed to fetch puzzle for level ${level}: ${error.message}`);
   }

   return data;
};

/**
 * Returns the total number of puzzles for a given grid size.
 */
const getNumberOfPuzzles = async (gridSize: number): Promise<number> => {
   const { count, error } = await supabase
      .from('puzzles')
      .select('*', { count: 'exact', head: true })
      .eq('grid_size', gridSize);

   if (error) {
      throw new Error(`Failed to fetch puzzle count for grid size ${gridSize}: ${error.message}`);
   }

   return count ?? 0;
};

/**
 * Returns a sorted list of all grid sizes that have at least one puzzle.
 */
const getGridSizes = async (): Promise<number[]> => {
   const { data, error } = await supabase
      .from('puzzles')
      .select('grid_size');

   if (error) {
      throw new Error(`Failed to fetch grid sizes: ${error.message}`);
   }

   const unique = [...new Set(data.map((row) => row.grid_size))];
   return unique.sort((a, b) => a - b);
};

export { getPuzzle, getNumberOfPuzzles, getGridSizes };