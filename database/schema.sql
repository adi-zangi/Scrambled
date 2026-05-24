-- schema.sql
--
-- Creates the puzzles table for the Scrambled puzzle game.
-- Run this in the Supabase SQL Editor before importing any data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: puzzles
CREATE TABLE puzzles (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_number       INTEGER NOT NULL UNIQUE,
  image_url          TEXT NOT NULL,
  image_width        INTEGER NOT NULL,
  image_height       INTEGER NOT NULL,
  grid_size          INTEGER NOT NULL,
  solved             BOOLEAN NOT NULL DEFAULT FALSE,
  progress           JSONB NOT NULL DEFAULT '[]'::JSONB,
  completion_message TEXT NOT NULL
);

CREATE INDEX idx_puzzles_level_number ON puzzles (level_number);
CREATE INDEX idx_puzzles_solved ON puzzles (solved);
