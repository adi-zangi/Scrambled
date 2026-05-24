/**
 * puzzle.ts
 *
 * Shared TypeScript types for the Scrambled puzzle game.
 * These types mirror the structure of the puzzles table in Supabase.
 */

export interface Puzzle {
  id: string;
  level_number: number;
  image_url: string;
  image_width: number;
  image_height: number;
  grid_size: number;
  solved: boolean;
  progress: number[];
  completion_message: string;
}