/**
 * Image utility functions for fetching, caching, and building Cloudinary URLs.
 */

export interface PuzzleImage {
   uri: string;
   desc: string;
   width: number;
   height: number;
}

const getImage = (level: number): PuzzleImage => {
   if (level === 0) {
      return {
            uri: 'https://res.cloudinary.com/scrambled/image/upload/v1778559544/tea_e9qcrk.jpg',
            desc: 'A teapot and cup',
            width: 1024,
            height: 1024,
         };
   }    
   return {
      uri: 'https://res.cloudinary.com/scrambled/image/upload/v1778374693/otter_unszkv.png',
      desc: 'An otter',
      width: 1344,
      height: 1008,
   };
}

export { getImage };