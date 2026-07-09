/**
 * Puzzle utility functions for grid position, sizing, and shuffle logic.
 */

import { useWindowDimensions } from "react-native";
import { Puzzle } from '../types/puzzle';

/**
 * Dimensions of an N x N puzzle board and its tiles in pixels.
 */
export interface Board {
   gridSize: number;
   boardWidth: number;
   boardHeight: number;
   tileWidth: number;
   tileHeight: number;
   tileBorderWidth: number;
}

/**
 * Calculates the board and tile pixel dimensions to fit a given puzzle image
 * within the available screen space while preserving its aspect ratio.
 * @param puzzle - A Puzzle object
 * @returns A Board object
 */
const useBoard = (puzzle: Puzzle): Board => {
   const board =
   {
      gridSize: puzzle.grid_size,
      boardWidth: 0,
      boardHeight: 0,
      tileWidth: 0,
      tileHeight: 0,
      tileBorderWidth: 2,
   };

   const { width, height } = useWindowDimensions();
   const maxWidth  = width  * 0.95;
   const maxHeight = height * 0.95;

   const imageWidth = puzzle.image_width;
   const imageHeight = puzzle.image_height;

   // Fit the board inside available space, preserving image ratio
   if (maxWidth > maxHeight) {
      board.boardHeight = maxHeight;
      board.boardWidth = (imageWidth / imageHeight) * board.boardHeight;
   } else {
      board.boardWidth = maxWidth;
      board.boardHeight = (imageHeight / imageWidth) * board.boardWidth;
   }

   // Tile size derived from board size and tile border as exact integers
   board.tileWidth = Math.floor(board.boardWidth / board.gridSize)
      + (board.tileBorderWidth * 2);
   board.tileHeight = Math.floor(board.boardHeight / board.gridSize)
      + (board.tileBorderWidth * 2);

   // Recalculate board size from tile to include the borders
   board.boardWidth = board.tileWidth * board.gridSize;
   board.boardHeight = board.tileHeight * board.gridSize;

   return board;
}

/**
 * Produces a shuffled copy of the tile state that is always solvable by
 * applying a number of random adjacent swaps to the solved state.
 * @param tiles - The solved tile array to shuffle (e.g. [0, 1, 2, ... N*N-1])
 * @param swaps - Number of random adjacent swaps to perform (default: 300)
 * @returns A new shuffled array
 */
const shuffle = (arr: number[], N: number): number[] => {
  const a = [...arr];
  const total = N * N;
  const swaps = total * 20;

  // Build from solved state via random adjacent swaps
  for (let k = 0; k < swaps; k++) {
      const i = Math.floor(Math.random() * total);
      const neighbors = [];
      if (i % N > 0)       neighbors.push(i - 1);
      if (i % N < N-1)     neighbors.push(i + 1);
      if (i >= N)          neighbors.push(i - N);
      if (i < total - N)   neighbors.push(i + N);
      const j = neighbors[Math.floor(Math.random() * neighbors.length)];
      [a[i], a[j]] = [a[j], a[i]];
  }

  // Guarantee not accidentally solved
  if (arr.every((v, i) => v === i)) {
      [arr[0], arr[1]] = [arr[1], arr[0]];
      [arr[N], arr[N + 1]] = [arr[N + 1], arr[N]];
  }

  return a;
}

/**
 * Returns the row index of a tile in the grid.
 * @param i - The tile's board index (0 to N*N-1)
 * @param N - The number of columns (and rows) in the grid
 * @returns Row index (0 to N-1), starting from the top
 */
const getRow = (i: number, N: number): number => {
   'worklet';
   return Math.floor(i / N);
}

/**
 * Returns the column index of a tile in the grid.
 * @param i - The tile's board index (0 to N*N-1)
 * @param N - The number of columns (and rows) in the grid
 * @returns Column index (0 to N-1), starting from the left
 */
const getCol = (i: number, N: number): number => {
   'worklet';
   return i % N;
}

/**
 * Returns the horizontal pixel position of a tile on the board.
 * @param i     - The tile's board index (0 to N*N-1)
 * @param board - The Board object
 * @returns X position in pixels from the left edge of the board
 */
const tileX = (i: number, board: Board): number => {
   'worklet';
   return getCol(i, board.gridSize) * board.tileWidth;
}

/**
 * Returns the vertical pixel position of a tile on the board.
 * @param i     - The tile's board index (0 to N*N-1)
 * @param board - The Board object
 * @returns Y position in pixels from the top edge of the board
 */
const tileY = (i: number, board: Board): number => {
   'worklet';
   return getRow(i, board.gridSize) * board.tileHeight;
}

/**
* Converts an x/y pixel position on the board to a board index.
* @param x     - X position in pixels from the left edge of the board
* @param y     - Y position in pixels from the top edge of the board
* @param board - The Board object
* @returns Board index or -1 if outside the board
*/
const indexFromPos = (x: number, y: number, board: Board): number => {
   'worklet';
   const col = Math.floor(x / board.tileWidth);
   const row = Math.floor(y / board.tileHeight);
   if (col < 0 || col >= board.gridSize || row < 0 || row >= board.gridSize) {
      return -1;
   }
   return row * board.gridSize + col;
}

export { shuffle, tileX, tileY, useBoard, indexFromPos };

