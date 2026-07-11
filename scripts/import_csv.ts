/**
 * import_csv.ts
 *
 * Reads a puzzle CSV file and upserts all rows into the Supabase puzzles table,
 * inserting new rows and updating existing ones. The table must already exist
 * before running this script (see schema.sql).
 * 
 * After upserting, warms Cloudinary's transformation cache for each puzzle's
 * thumbnail sizes, so the first time to load the image isn't slower.
 *
 * Usage:
 *   npx tsx scripts/import_csv.ts data/puzzles.csv
 *
 * Dependencies:
 *   npm install @supabase/supabase-js csv-parser dotenv
 *   npm install --save-dev tsx typescript @types/node
 *
 * Environment variables:
 *   Create a .env file in the project root with the following variables
 *   (make sure .env is listed in .gitignore):
 *
 *   SUPABASE_URL=your_supabase_url
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 *
 *   Both values are in the Supabase dashboard:
 *     SUPABASE_URL — Project Overview page
 *     SUPABASE_SERVICE_ROLE_KEY — Project Settings > API Keys
 *
 * CSV columns expected:
 *   Level Number, Image URL, Image Width, Image Height, Grid Size, Completion Message
 */

import { createClient } from '@supabase/supabase-js';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import 'dotenv/config';
import { BOARD_MAX_SIZES, buildBoardImageUrl, buildThumbnailUrl, ICON_SIZES } from '../src/constants/thumbnails.js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
   console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
   process.exit(1);
}

const CSV_FILE: string = process.argv[2];

if (!CSV_FILE) {
   console.error('Usage: npx ts-node import_csv.ts <path-to-csv>');
   process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CsvRow {
   'Level Number': string;
   'Image URL': string;
   'Image Width': string;
   'Image Height': string;
   'Grid Size': string;
   'Completion Message': string;
}

interface PuzzleRow {
   level_number: number;
   image_url: string;
   image_width: number;
   image_height: number;
   grid_size: number;
   completion_message: string;
}

function transformRow(row: CsvRow): PuzzleRow {
   return {
      level_number:       parseInt(row['Level Number']),
      image_url:          row['Image URL'],
      image_width:        parseInt(row['Image Width']),
      image_height:       parseInt(row['Image Height']),
      grid_size:          parseInt(row['Grid Size']),
      completion_message: row['Completion Message'],
   };
}

/**
 * Requests each puzzle's thumbnail URLs once, for every configured size,
 * so Cloudinary generates and caches the derived images ahead of time
 * instead of on a real player's first request.
 */
async function warmThumbnails(rows: PuzzleRow[]): Promise<void> {
   const urls = rows.flatMap((row) => [
      ...ICON_SIZES.map((size) => buildThumbnailUrl(row.image_url, size)),
      ...BOARD_MAX_SIZES.map((bucket) =>
         buildBoardImageUrl(row.image_url, row.image_width, row.image_height, bucket)
      ),
   ]);

   console.log(`Warming ${urls.length} thumbnail variants...`);

   const results = await Promise.allSettled(urls.map((url) => fetch(url)));

   const failed = results
      .map((result, i) => ({ result, url: urls[i] }))
      .filter(({ result }) => result.status === 'rejected' || !result.value.ok);

   if (failed.length > 0) {
      console.warn(`${failed.length}/${urls.length} thumbnail warm requests failed:`);
      for (const { url } of failed) {
         console.warn(`  - ${url}`);
      }
   } else {
      console.log(`Successfully warmed all ${urls.length} thumbnail variants.`);
   }
}

async function importCSV(): Promise<void> {
   const rows: PuzzleRow[] = [];

   await new Promise<void>((resolve, reject) => {
      createReadStream(CSV_FILE)
         .pipe(csv())
         .on('data', (row: CsvRow) => rows.push(transformRow(row)))
         .on('end', resolve)
         .on('error', reject);
   });

   console.log(`Read ${rows.length} rows from ${CSV_FILE}`);

   const { error } = await supabase
      .from('puzzles')
      .upsert(rows, { onConflict: 'level_number' });

   if (error) {
      console.error('Upsert failed:', error.message);
      process.exit(1);
   }

   console.log(`Successfully upserted ${rows.length} puzzles into Supabase.`);

   await warmThumbnails(rows);
}

importCSV();