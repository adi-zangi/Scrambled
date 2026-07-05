/**
 * puzzleService.ts
 *
 * Data access functions for the puzzles table in Supabase.
 * All database queries for puzzle data should go through this service.
 *
 * Environment variables:
 *   Supabase credentials are read from app.config.ts, which in turn reads
 *   them from a .env file in the project root (make sure .env is listed in
 *   .gitignore):
 *
 *   SUPABASE_URL=your_supabase_url
 *   SUPABASE_ANON_KEY=your_anon_key
 *
 *   Both values are in the Supabase dashboard:
 *     SUPABASE_URL      — Project Overview page
 *     SUPABASE_ANON_KEY — Project Settings > API Keys (the "anon" / "public" key)
 * 
 *   This must be the anon key, not the service role key. The service role key
 *   belongs only in scripts/import_csv.ts, which reads it from this same .env
 *   file under
 *   SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from '@supabase/supabase-js';
import { Puzzle, PuzzleProgress } from '../src/types/puzzle';
import Constants from 'expo-constants';

const supabase = createClient(
   Constants.expoConfig?.extra?.supabaseUrl,
   Constants.expoConfig?.extra?.supabaseAnonKey
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
 * Fetches all puzzles, ordered by level number.
 */
const getAllPuzzles = async (): Promise<Puzzle[]> => {
   const { data, error } = await supabase
      .from('puzzles')
      .select('*')
      .order('level_number', { ascending: true });

   if (error) {
      throw new Error(`Failed to fetch all puzzles: ${error.message}`);
   }

   return data;
};

/**
 * Fetches a device's saved solved/progress state for a puzzle.
 * Returns null if this device has never reported progress on it, in
 * which case the caller should treat the puzzle as unsolved and unstarted.
 */
const getPuzzleProgress = async (
   deviceId: string,
   puzzleId: string
): Promise<PuzzleProgress | null> => {
   const { data, error } = await supabase
      .from('puzzle_progress')
      .select('*')
      .eq('device_id', deviceId)
      .eq('puzzle_id', puzzleId)
      .maybeSingle();

   if (error) {
      throw new Error(`Failed to fetch puzzle progress for puzzle ${puzzleId}: ${error.message}`);
   }

   return data;
};

/**
 * Fetches every progress row a device has, across all puzzles.
 */
const getAllPuzzleProgressForDevice = async (deviceId: string): Promise<PuzzleProgress[]> => {
   const { data, error } = await supabase
      .from('puzzle_progress')
      .select('*')
      .eq('device_id', deviceId);

   if (error) {
      throw new Error(`Failed to fetch puzzle progress for device: ${error.message}`);
   }

   return data;
};

/**
 * Fetches whether a device has already solved a puzzle.
 */
const getPuzzleSolved = async (deviceId: string, puzzleId: string): Promise<boolean> => {
   const { data, error } = await supabase
      .from('puzzle_progress')
      .select('solved')
      .eq('device_id', deviceId)
      .eq('puzzle_id', puzzleId)
      .maybeSingle();

   if (error) {
      throw new Error(`Failed to fetch solved status for puzzle ${puzzleId}: ${error.message}`);
   }

   return data?.solved ?? false;
};

/**
 * Marks a puzzle as solved for a device. Creates the progress row if it
 * doesn't exist yet. Does not affect the stored progress array.
 */
const markPuzzleSolved = async (deviceId: string, puzzleId: string): Promise<void> => {
   const { error } = await supabase
      .from('puzzle_progress')
      .upsert(
         { device_id: deviceId, puzzle_id: puzzleId, solved: true },
         { onConflict: 'device_id,puzzle_id' }
      );

   if (error) {
      throw new Error(`Failed to mark puzzle ${puzzleId} as solved: ${error.message}`);
   }
};

/**
 * Saves a device's current tile arrangement for a puzzle. Creates the
 * progress row if it doesn't exist yet. Does not affect the stored
 * solved flag.
 */
const savePuzzleProgress = async (
   deviceId: string,
   puzzleId: string,
   progress: number[]
): Promise<void> => {
   const { error } = await supabase
      .from('puzzle_progress')
      .upsert(
         { device_id: deviceId, puzzle_id: puzzleId, progress },
         { onConflict: 'device_id,puzzle_id' }
      );

   if (error) {
      throw new Error(`Failed to save puzzle progress for puzzle ${puzzleId}: ${error.message}`);
   }
};

export {
   getPuzzle,
   getAllPuzzles,
   getPuzzleProgress,
   getAllPuzzleProgressForDevice,
   getPuzzleSolved,
   markPuzzleSolved,
   savePuzzleProgress,
};