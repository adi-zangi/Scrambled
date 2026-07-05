/**
 * puzzle.ts
 *
 * Shared TypeScript types for the Scrambled puzzle game.
 * These types mirror the structure of the tables in Supabase (see schema.sql).
 */

/**
 * Table: puzzles
 */
export interface Puzzle {
   id: string;
   level_number: number;
   image_url: string;
   image_width: number;
   image_height: number;
   grid_size: number;
   completion_message: string;
}

/**
 * Table: puzzle_progress
 */
export interface PuzzleProgress {
   id: string;
   device_id: string;
   puzzle_id: string;
   solved: boolean;
   progress: number[];
}