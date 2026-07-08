/**
 * Interactive puzzle board. Handles tile swapping, win detection, and move tracking.
 */

import { Image, StyleSheet, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Board, indexFromPos, shuffle, tileX, tileY } from '../utils/puzzleUtils';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { ComposedGesture, Gesture, GestureDetector, GestureType, PanGesture } from 'react-native-gesture-handler';
import { Puzzle } from '../types/puzzle';
import { runOnJS } from 'react-native-worklets';
import { getPuzzleProgress, markPuzzleSolved, savePuzzleProgress } from '@/services/puzzleService';
const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
   puzzle: Puzzle;
   board: Board;
   deviceId: string;
   onPuzzleSolved: () => void;
}

interface State {
   boardArray: number[];
   selected: number | null;
   solved: boolean;
   loading: boolean;
}

interface DragState {
  isDragging:      SharedValue<boolean>;
  dragBoardIndex:  SharedValue<number>;
  dragTileVal:     SharedValue<number>;
  dragX:           SharedValue<number>;
  dragY:           SharedValue<number>;
}

interface TileProps {
  boardIndex:    number;
  tileVal:       number;
  board:         Board;
  imageUri:      string;
  gesture:       ComposedGesture | GestureType;
  selectedIndex: number | null;
}

const PuzzleBoard = (props: Props) => {
   const { puzzle, board, deviceId } = props;
   const N = props.puzzle.grid_size;

   const [state, setState] = useState<State>({
      boardArray: [],
      selected: null,
      solved: false,
      loading: true,
   });

   // Shared values for the dragged tile's animation
   const dragX            = useSharedValue(0);
   const dragY            = useSharedValue(0);
   const dragBoardIndex   = useSharedValue(-1);
   const dragTileVal      = useSharedValue(-1);
   const isDragging       = useSharedValue(false);

   const dragState: DragState = {
      dragX,
      dragY,
      dragBoardIndex,
      dragTileVal,
      isDragging,
   };

   // A copy of state.boardArray so the unmount cleanup below can read the
   // latest arrangement without depending on it and re-running on every
   // move.
   const boardArrayRef = useRef<number[]>([]);
   useEffect(() => {
      boardArrayRef.current = state.boardArray;
   }, [state.boardArray]);

   // Loads this device's saved progress when the puzzle opens (or shuffles
   // a new scrambled board if there's none saved yet), and saves the
   // current arrangement when it closes.
   useEffect(() => {
      let cancelled = false;

      const load = async () => {
         const saved = await getPuzzleProgress(deviceId, puzzle.id);
         if (cancelled) {
            return;
         }

         let boardArray: number[];
         let solved = false;

         if (saved?.solved) {
            solved = true;
            boardArray = Array.from({ length: N * N }, (_, i) => i);
         } else if (saved !== null && saved.progress.length === N * N) {
            boardArray = saved.progress;
         } else {
            boardArray = shuffle(Array.from({ length: N * N }, (_, i) => i), N);
         }

         setState({
            boardArray,
            selected: null,
            solved,
            loading: false,
         });
      };

      load();

      return () => {
         cancelled = true;
         if (boardArrayRef.current.length > 0) {
            savePuzzleProgress(deviceId, puzzle.id, boardArrayRef.current).catch((error) => {
               console.error('Failed to save puzzle progress on close:', error);
            });
         }
      };
   }, [puzzle.level_number]);

   /**
    * Swaps two tiles on the board.
    * @param fromIndex - Board index of the first tile to swap
    * @param toIndex   - Board index of the second tile to swap
    */
   const doSwap = (fromIndex: number, toIndex: number) => {
      if (state.solved || fromIndex === toIndex) {
         return;
      }
      const newBoard = [...state.boardArray];
      let solved = false;
      [newBoard[fromIndex], newBoard[toIndex]] = [newBoard[toIndex], newBoard[fromIndex]];
      if (newBoard.every((v, i) => v === i)) {
         solved = true;
         markPuzzleSolved(deviceId, puzzle.id).catch((error) => {
            console.error('Failed to save solved status:', error);
         });
         props.onPuzzleSolved();
      }
      setState({
         ...state,
         boardArray: newBoard,
         selected: null,
         solved: solved,
      });
   }

   /**
    * Handles a tile press during the puzzle game.
    * Selects a tile if none is selected, deselects it if pressed again,
    * or swaps it with whichever tile is already selected.
    * @param boardIndex - The board index of the pressed tile (0 to N*N-1)
    */
   const handlePress = (boardIndex: number) => {
      if (state.solved) {
         return;
      }
      const selected = state.selected;
      if (selected === null) {
         setState({
            ...state,
            selected: boardIndex,
         });
      } else if (selected === boardIndex) {
         setState({
            ...state,
            selected: null,
         });
      } else {
         doSwap(selected, boardIndex);
      }
   }

   /**
    * Creates a combined tap and drag gesture for a tile at the given board index.
    * Tap selects or swaps the tile. Drag swaps the tile with whichever tile
    * it's dropped onto. Gestures are disabled when the puzzle is solved.
    * @param boardIndex - The board index of the tile being interacted with
    * @returns A combined exclusive gesture handler for tap and drag
    */
   const createTileGesture = (boardIndex: number) => {
      const tap = Gesture.Tap()
         .enabled(!state.solved)
         .onEnd(() => {
            'worklet';
            runOnJS(handlePress)(boardIndex);
         });

      const pan = createPanGesture(boardIndex);

      return Gesture.Exclusive(pan, tap);
   }

   /**
    * Creates a pan gesture for a tile at the given board index.
    * On drag end, swaps with whichever tile is under the cursor.
    * The gesture is disabled when the puzzle is solved.
    * @param boardIndex - The board index of the tile being dragged
    * @returns A pan gesture handler to attach to a GestureDetector
    */
   const createPanGesture = (boardIndex: number): PanGesture => {
      return Gesture.Pan()
         .enabled(!state.solved)
         .onStart(() => {
            'worklet';
            isDragging.value     = true;
            dragBoardIndex.value = boardIndex;
            dragTileVal.value    = state.boardArray[boardIndex] ?? 0;
            dragX.value          = tileX(boardIndex, board);
            dragY.value          = tileY(boardIndex, board);
         })
         .onUpdate((e) => {
            'worklet';
            dragX.value = tileX(boardIndex, board) + e.translationX;
            dragY.value = tileY(boardIndex, board) + e.translationY;
         })
         .onEnd((e) => {
            'worklet';
            const landX       = tileX(boardIndex, board) + e.translationX + board.tileWidth  / 2;
            const landY       = tileY(boardIndex, board) + e.translationY + board.tileHeight / 2;
            const targetIndex = indexFromPos(landX, landY, board);
            if (targetIndex >= 0 && targetIndex !== boardIndex) {
               runOnJS(doSwap)(boardIndex, targetIndex);
            }
            isDragging.value     = false;
            dragBoardIndex.value = -1;
            dragTileVal.value    = -1;
         });
   }

   // Animates the ghost tile's position and visibility while dragging.
   const ghostAnimatedStyle = useAnimatedStyle(() => ({
      left:      dragX.value,
      top:       dragY.value,
      opacity:   isDragging.value ? 0.85 : 0,
   }));

   // Animates which portion of the source image the ghost tile shows.
   const ghostImageAnimatedStyle = useAnimatedStyle(() => ({
      width:    board.boardWidth,
      height:   board.boardHeight,
      position: 'absolute',
      left:     dragTileVal.value >= 0 ? -tileX(dragTileVal.value, board) : 0,
      top:      dragTileVal.value >= 0 ? -tileY(dragTileVal.value, board) : 0,
   }));

   if (state.loading) {
      return (
         <View
            style={[
               styles.board,
               { width: board.boardWidth, height: board.boardHeight }
            ]}
         />
      );
   }

   return (
      <View
         style={[
            styles.board,
            {
               width:  board.boardWidth,
               height: board.boardHeight,
            }
         ]}
      >
         {state.boardArray.map((tileVal, boardIndex) => (
            <PuzzleTile
               key={boardIndex}
               boardIndex={boardIndex}
               tileVal={tileVal}
               board={board}
               imageUri={puzzle.image_url}
               gesture={createTileGesture(boardIndex)}
               selectedIndex={state.selected}
            />
         ))}

         <Animated.View
            testID="ghost-tile"
            style={[
               styles.ghost,
               { width: board.tileWidth, height: board.tileHeight },
               ghostAnimatedStyle,
            ]}
            pointerEvents="none"
         >
            <AnimatedImage
               source={{ uri: puzzle.image_url }}
               style={ghostImageAnimatedStyle}
            />
         </Animated.View>
      </View>
   );
}

/**
 * Renders a single puzzle tile. Shrinks slightly when selected to indicate
 * the selection; otherwise renders at full size. Border stays a static
 * transparent width throughout so the tile grid never shifts.
 */
const PuzzleTile = (props: TileProps) => {
   const { boardIndex, tileVal, board, imageUri, gesture, selectedIndex } = props;

   const isSelected = boardIndex === selectedIndex;

   return (
      <GestureDetector key={boardIndex} gesture={gesture}>
         <Animated.View
            testID={`tile-${boardIndex}`}
            style={[
               styles.tile,
               {
                  width:       board.tileWidth,
                  height:      board.tileHeight,
                  left:        tileX(boardIndex, board),
                  top:         tileY(boardIndex, board),
                  borderWidth: board.tileBorderWidth,
                  borderColor: 'transparent',
               },
               isSelected && styles.selectedTile,
            ]}
         >
            <Image
               source={{ uri: imageUri }}
               style={[
                  {
                     width:    board.boardWidth,
                     height:   board.boardHeight,
                     position: 'absolute',
                     left:     -tileX(tileVal, board),
                     top:      -tileY(tileVal, board),
                  }
               ]}
            />
         </Animated.View>
      </GestureDetector>
   );
}

const styles = StyleSheet.create({
   board: {
      position:    'relative',
      overflow:    'hidden',
      borderRadius: 4,
   },
   tile: {
      position: 'absolute',
      overflow: 'hidden',
   },
   selectedTile: {
      transform: [{ scale: 0.95 }],
   },
   ghost: {
      position:  'absolute',
      zIndex:    10,
      elevation: 10,
      overflow:  'hidden',
  },
});

export default PuzzleBoard;