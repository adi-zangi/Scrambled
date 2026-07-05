-- schema.sql
--
-- Creates the puzzles table for the Scrambled puzzle game.
-- Run this in the Supabase SQL Editor before importing any data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: puzzles
-- Static puzzle content, shared across all devices.
CREATE TABLE puzzles (
   id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   level_number       INTEGER NOT NULL UNIQUE,
   image_url          TEXT NOT NULL,
   image_width        INTEGER NOT NULL,
   image_height       INTEGER NOT NULL,
   grid_size          INTEGER NOT NULL,
   completion_message TEXT NOT NULL
);

CREATE INDEX idx_puzzles_level_number ON puzzles (level_number);

-- Table: puzzle_progress
-- Per-device solved/progress state for each puzzle. A device is identified
-- by an app-generated identifier (e.g. a UUID persisted in local storage).
CREATE TABLE puzzle_progress (
   id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   device_id    TEXT NOT NULL,
   puzzle_id    UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
   solved       BOOLEAN NOT NULL DEFAULT FALSE,
   progress     JSONB NOT NULL DEFAULT '[]'::JSONB,
   UNIQUE (device_id, puzzle_id)
);

CREATE INDEX idx_puzzle_progress_device ON puzzle_progress (device_id);
CREATE INDEX idx_puzzle_progress_puzzle ON puzzle_progress (puzzle_id);
CREATE INDEX idx_puzzle_progress_solved ON puzzle_progress (solved);

-- Row Level Security
--
-- The app talks to Supabase using the anon key, not the service role key.
-- These policies define what the anon key is allowed to do. Note that
-- device_id is a client-supplied value (not tied to Supabase Auth), so
-- these policies do NOT prevent one device from reading or writing another
-- device's progress row. They only scope the anon key down to these two
-- tables and specific operations, instead of full unrestricted database
-- access. Puzzle content (the puzzles table) is never writable by the app;
-- only the import script, using the service role key, can modify it.

ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_progress ENABLE ROW LEVEL SECURITY;

-- puzzles: public read-only. No insert/update/delete policy exists for
-- this table, so those operations are denied for the anon key by default.
CREATE POLICY "Public read access to puzzles"
   ON puzzles
   FOR SELECT
   USING (true);

-- puzzle_progress: anon key can read and write freely.
CREATE POLICY "Public read access to puzzle progress"
   ON puzzle_progress
   FOR SELECT
   USING (true);

CREATE POLICY "Public insert access to puzzle progress"
   ON puzzle_progress
   FOR INSERT
   WITH CHECK (true);

CREATE POLICY "Public update access to puzzle progress"
   ON puzzle_progress
   FOR UPDATE
   USING (true)
   WITH CHECK (true);