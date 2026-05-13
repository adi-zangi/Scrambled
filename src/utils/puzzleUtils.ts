/**
 * Puzzle utility functions for grid position, adjacency, sizing, and shuffle logic.
 */

import { useWindowDimensions } from "react-native";
import { Image } from "./imageUtils";

/**
 * Dimensions of an N x N puzzle board and its tiles in pixels.
 */
export interface Board {
   N: number;
   boardWidth: number;
   boardHeight: number;
   tileWidth: number;
   tileHeight: number;
   tileBorderWidth: number;
}

/**
 * Returns the grid size (N) for a given level number.
 * @param level - The level number (0-based)
 * @returns The number of columns and rows in the grid
 */
const getGridSize = (level: number): number => {
  if (level === 0) return 3;  // 3X3 — tutorial
  return 4;
};

/**
 * Calculates the board and tile pixel dimensions to fit a given image
 * within the available screen space while preserving its aspect ratio.
 * @param image - An image object
 * @param N     - The number of columns (and rows) in the grid
 * @returns A Board object
 */
const useBoard = (image: Image, N: number): Board => {
   const board =
   {
      N: N,
      boardWidth: 0,
      boardHeight: 0,
      tileWidth: 0,
      tileHeight: 0,
      tileBorderWidth: 2,
   };

   const { width, height } = useWindowDimensions();
   const maxWidth  = width  * 0.8;
   const maxHeight = height * 0.8;

   const imageWidth = image.width;
   const imageHeight = image.height;

   // Fit the board inside available space, preserving image ratio
   if (maxWidth > maxHeight) {
      board.boardHeight = maxHeight;
      board.boardWidth = (imageWidth / imageHeight) * board.boardHeight;
   } else {
      board.boardWidth = maxWidth;
      board.boardHeight = (imageHeight / imageWidth) * board.boardWidth;
   }

   // Tile size derived from board size and tile border as exact integers
   board.tileWidth = Math.floor(board.boardWidth / N) + (board.tileBorderWidth * 2);
   board.tileHeight = Math.floor(board.boardHeight / N) + (board.tileBorderWidth * 2);

   // Recalculate board size from tile to include the borders
   board.boardWidth = board.tileWidth * N;
   board.boardHeight = board.tileHeight * N;

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
   return Math.floor(i / N);
}

/**
 * Returns the column index of a tile in the grid.
 * @param i - The tile's board index (0 to N*N-1)
 * @param N - The number of columns (and rows) in the grid
 * @returns Column index (0 to N-1), starting from the left
 */
const getCol = (i: number, N: number): number => {
   return i % N;
}

/**
 * Returns the horizontal pixel position of a tile on the board.
 * @param i     - The tile's board index (0 to N*N-1)
 * @param board - The Board object
 * @returns X position in pixels from the left edge of the board
 */
const tileX = (i: number, board: Board): number => {
   return getCol(i, board.N) * board.tileWidth;
}

/**
 * Returns the vertical pixel position of a tile on the board.
 * @param i     - The tile's board index (0 to N*N-1)
 * @param board - The Board object
 * @returns Y position in pixels from the top edge of the board
 */
const tileY = (i: number, board: Board): number => {
   return getRow(i, board.N) * board.tileHeight;
}

/**
 * Determines whether two board positions are adjacent to each other
 * horizontally or vertically. Prevents false adjacency across row
 * boundaries by checking that horizontal neighbours share the same row.
 * @param a - The first board index (0 to N*N-1)
 * @param b - The second board index (0 to N*N-1)
 * @param N - The number of columns (and rows) in the grid
 * @returns True if the two positions are directly next to each other
 */
const isAdj = (a: any, b: any, N: number): boolean => {
   const sameRow     = getRow(a, N) === getRow(b, N);
   const sameCol     = getCol(a, N) === getCol(b, N);
   const oneRowApart = Math.abs(getRow(a, N) - getRow(b, N)) === 1;
   const oneColApart = Math.abs(getCol(a, N) - getCol(b, N)) === 1;

   const horizontal = sameRow && oneColApart;
   const vertical   = sameCol && oneRowApart;

   return horizontal || vertical;
}

/**
* Converts an x/y pixel position on the board to a board index.
* @param x     - X position in pixels from the left edge of the board
* @param y     - Y position in pixels from the top edge of the board
* @param board - The Board object
* @returns Board index or -1 if outside the board
*/
const indexFromPos = (x: number, y: number, board: Board): number => {
   const col = Math.floor(x / board.tileWidth);
   const row = Math.floor(y / board.tileHeight);
   if (col < 0 || col >= board.N || row < 0 || row >= board.N) {
      return -1;
   }
   return row * board.N + col;
}

export { shuffle, tileX, tileY, useBoard, isAdj, indexFromPos, getGridSize };

