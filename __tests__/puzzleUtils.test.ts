/**
 * Tests for puzzleUtils — grid position, adjacency, index conversion, and shuffle.
 */

import { tileX, tileY, indexFromPos, shuffle } from '@/src/utils/puzzleUtils';
import { Board } from '@/src/utils/puzzleUtils';

const board: Board = {
   gridSize:        3,
   boardWidth:      300,
   boardHeight:     300,
   tileWidth:       100,
   tileHeight:      100,
   tileBorderWidth: 1,
};

// Grid layout for reference:
//   0 1 2
//   3 4 5
//   6 7 8

describe('tileX', () => {

   it('returns 0 for column 0', () => {
      expect(tileX(0, board)).toBe(0);   // tile 0: col 0
      expect(tileX(3, board)).toBe(0);   // tile 3: col 0
      expect(tileX(6, board)).toBe(0);   // tile 6: col 0
   });

   it('returns tileWidth for column 1', () => {
      expect(tileX(1, board)).toBe(100); // tile 1: col 1
      expect(tileX(4, board)).toBe(100); // tile 4: col 1
      expect(tileX(7, board)).toBe(100); // tile 7: col 1
   });

   it('returns 2 * tileWidth for column 2', () => {
      expect(tileX(2, board)).toBe(200); // tile 2: col 2
      expect(tileX(5, board)).toBe(200); // tile 5: col 2
      expect(tileX(8, board)).toBe(200); // tile 8: col 2
   });

});

describe('tileY', () => {

   it('returns 0 for row 0', () => {
      expect(tileY(0, board)).toBe(0);   // tile 0: row 0
      expect(tileY(1, board)).toBe(0);   // tile 1: row 0
      expect(tileY(2, board)).toBe(0);   // tile 2: row 0
   });

   it('returns tileHeight for row 1', () => {
      expect(tileY(3, board)).toBe(100); // tile 3: row 1
      expect(tileY(4, board)).toBe(100); // tile 4: row 1
      expect(tileY(5, board)).toBe(100); // tile 5: row 1
   });

   it('returns 2 * tileHeight for row 2', () => {
      expect(tileY(6, board)).toBe(200); // tile 6: row 2
      expect(tileY(7, board)).toBe(200); // tile 7: row 2
      expect(tileY(8, board)).toBe(200); // tile 8: row 2
   });

});

describe('indexFromPos', () => {

   it('returns the correct board index for pixel positions inside the board', () => {
      expect(indexFromPos(  0,   0, board)).toBe(0); // top-left of tile 0
      expect(indexFromPos( 50,  50, board)).toBe(0); // centre of tile 0
      expect(indexFromPos(150,  50, board)).toBe(1); // centre of tile 1
      expect(indexFromPos(250,  50, board)).toBe(2); // centre of tile 2
      expect(indexFromPos( 50, 150, board)).toBe(3); // centre of tile 3
      expect(indexFromPos(150, 150, board)).toBe(4); // centre of tile 4
      expect(indexFromPos(250, 250, board)).toBe(8); // centre of tile 8
   });

   it('returns -1 for positions outside the board', () => {
      expect(indexFromPos(-1,    50, board)).toBe(-1); // left of board
      expect(indexFromPos( 50,   -1, board)).toBe(-1); // above board
      expect(indexFromPos(300,   50, board)).toBe(-1); // right edge (exclusive)
      expect(indexFromPos( 50,  300, board)).toBe(-1); // bottom edge (exclusive)
      expect(indexFromPos(999,  999, board)).toBe(-1); // far outside
   });

   it('is consistent with tileX and tileY', () => {
      for (let i = 0; i < board.gridSize * board.gridSize; i++) {
         const x = tileX(i, board) + board.tileWidth  / 2;
         const y = tileY(i, board) + board.tileHeight / 2;
         expect(indexFromPos(x, y, board)).toBe(i);
      }
   });

});

describe('shuffle', () => {

   const N     = 3;
   const tiles = Array.from({ length: N * N }, (_, i) => i); // [0..8]

   it('returns an array of the same length', () => {
      expect(shuffle([...tiles], N)).toHaveLength(tiles.length);
   });

   it('returns an array containing the same values', () => {
      const result = shuffle([...tiles], N);
      expect([...result].sort((a, b) => a - b)).toEqual(tiles);
   });

   it('does not mutate the input array', () => {
      const input = [...tiles];
      shuffle(input, N);
      expect(input === tiles).toBe(false);
   });

   it('does not return the solved state', () => {
      // Run many times — the guarantee-not-solved path should hold
      for (let i = 0; i < 20; i++) {
         const result = shuffle([...tiles], N);
         expect(result).not.toEqual(tiles);
      }
   });

});