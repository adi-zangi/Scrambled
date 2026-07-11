/**
 * thumbnails.ts
 *
 * Shared Cloudinary thumbnail configuration. Used to request puzzle
 * images in different sizes.
 *    ICON_SIZES: square level-select icons (LevelMenu.tsx)
 *    BOARD_MAX_SIZES: puzzle board images, bucketed by longest side,
 *    preserving each puzzle's original aspect ratio (PuzzleBoard.tsx) 
 * 
 * These sets are used to pre-warm Cloudinary's transformation cache after
 * each import in import_csv.ts, so the first time to load the image isn't
 * slower.
 */

export const ICON_SIZES = [150, 300] as const;
export const BOARD_MAX_SIZES = [400, 800, 1200] as const;

/**
 * Builds a Cloudinary URL for a given source image and size.
 * Defaults to a square crop (height = width). Pass an explicit height to
 * preserve a non-square image's original aspect ratio without cropping.
 */
export function buildThumbnailUrl(imageUrl: string, width: number, height: number = width): string {
   const w = Math.round(width);
   const h = Math.round(height);
   return imageUrl.replace('/upload/', `/upload/w_${w},h_${h},c_fill/`);
}

/**
 * Picks the smallest bucket that is >= target, so puzzle images are
 * never rendered below their needed resolution. Falls back to the
 * largest bucket if target exceeds all of them.
 */
function nearestBucket(target: number, buckets: readonly number[]): number {
   return buckets.find((bucket) => bucket >= target) ?? buckets[buckets.length - 1];
}

/**
 * Builds a puzzle board image URL, bucketed by longest side to keep
 * the set of possible URLs small, while preserving the source image's
 * original aspect ratio.
 */
export function buildBoardImageUrl(
   imageUrl: string,
   imageWidth: number,
   imageHeight: number,
   targetMaxDimension: number
): string {
   const bucket = nearestBucket(targetMaxDimension, BOARD_MAX_SIZES);
   const aspectRatio = imageWidth / imageHeight;

   const width = aspectRatio >= 1 ? bucket : Math.round(bucket * aspectRatio);
   const height = aspectRatio >= 1 ? Math.round(bucket / aspectRatio) : bucket;

   return buildThumbnailUrl(imageUrl, width, height);
}