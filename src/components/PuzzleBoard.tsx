/**
 * Interactive puzzle board. Handles tile swapping, win detection, and move tracking.
 */

import { Image, StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Board, indexFromPos, isAdj, shuffle, tileX, tileY } from '@/utils/puzzleUtils';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { ComposedGesture, Gesture, GestureDetector, GestureType, PanGesture } from 'react-native-gesture-handler';
import { PuzzleImage } from '@/utils/imageUtils';
import { runOnJS } from 'react-native-worklets';
const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
   level: number;
   image: PuzzleImage;
   board: Board;
   gridSize: number;
   onPuzzleSolved: () => void;
}

interface State {
   boardArray: number[];
   selected: number | null;
   solved: boolean;
}

interface DragState {
  isDragging:      SharedValue<boolean>;
  dragBoardIndex:  SharedValue<number>;
  dragTileVal:     SharedValue<number>;
  dragTargetIndex: SharedValue<number>;
  dragX:           SharedValue<number>;
  dragY:           SharedValue<number>;
}

interface TileProps {
  boardIndex: number;
  tileVal:    number;
  board:      Board;
  imageUri:   string;
  gesture:    ComposedGesture | GestureType;
  dragState:  DragState;
  state:      State;
  isTutorial: boolean;
  N:          number;
}

const PuzzleBoard = (props: Props) => {
   const { level, image, board } = props;
   const N = props.gridSize;

   const [state, setState] = useState<State>({
      boardArray: [],
      selected: null,
      solved: false,
   });

   // Shared values for the dragged tile's animation
   const dragX            = useSharedValue(0);
   const dragY            = useSharedValue(0);
   const dragBoardIndex   = useSharedValue(-1);
   const dragTileVal      = useSharedValue(-1);
   const dragTargetIndex  = useSharedValue(-1);
   const isDragging       = useSharedValue(false);

   const dragState: DragState = {
      dragX,
      dragY,
      dragBoardIndex,
      dragTileVal,
      dragTargetIndex,
      isDragging,
   };

   // Handles initial board setup and level changes
   useEffect(() => {
      setState({
         boardArray: shuffle(Array.from({ length: N * N }, (_, i) => i), N),
         selected:   null,
         solved:     false,
      });
   }, [level]);

   /**
    * Swaps two tiles on the board.
    * @param fromIndex - Board index of the first tile to swap
    * @param toIndex   - Board index of the second tile to swap
    */
   const doSwap = (fromIndex: number, toIndex: number) => {
      if (state.solved || !isAdj(fromIndex, toIndex, N)) {
         return;
      }
      const newBoard = [...state.boardArray];
      let solved = false;
      [newBoard[fromIndex], newBoard[toIndex]] = [newBoard[toIndex], newBoard[fromIndex]];
      if (newBoard.every((v, i) => v === i)) {
         solved = true;
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
    * Highlights the selected tile and swaps the last two selected tiles
    * if they are adjacent.
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
      } else if (isAdj(selected, boardIndex, N)) {
         doSwap(selected, boardIndex);
      } else {
         setState({
            ...state,
            selected: boardIndex,
         });
      }
   }

   /**
    * Creates a combined tap and drag gesture for a tile at the given board index.
    * Tap selects or swaps the tile. Drag swaps the tile.
    * Gestures are disabled when the puzzle is solved.
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
    * On drag end, swaps with the tile under the cursor if the tile is adjacent.
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
            dragX.value  = tileX(boardIndex, board) + e.translationX;
            dragY.value  = tileY(boardIndex, board) + e.translationY;
            const landX  = tileX(boardIndex, board) + e.translationX + board.tileWidth  / 2;
            const landY  = tileY(boardIndex, board) + e.translationY + board.tileHeight / 2;
            const target = indexFromPos(landX, landY, board);
            dragTargetIndex.value =
               target >= 0 && target !== boardIndex && isAdj(boardIndex, target, N)
                  ? target
                  : -1;
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
               imageUri={image.uri}
               gesture={createTileGesture(boardIndex)}
               dragState={dragState}
               state={state}
               isTutorial={level === 0}
               N={N}
            />
         ))}

         <Animated.View
            style={[
               styles.ghost,
               { width: board.tileWidth, height: board.tileHeight },
               ghostAnimatedStyle,
            ]}
            pointerEvents="none"
         >
            <AnimatedImage
               source={{ uri: image.uri }}
               style={useAnimatedStyle(() => ({
                  width:    board.boardWidth,
                  height:   board.boardHeight,
                  position: 'absolute',
                  left:     dragTileVal.value >= 0 ? -tileX(dragTileVal.value, board) : 0,
                  top:      dragTileVal.value >= 0 ? -tileY(dragTileVal.value, board) : 0,
               }))}
            />
         </Animated.View>
      </View>
   );
}

/**
 * Renders a single puzzle tile with animated drag and selection styles.
 */
const PuzzleTile = (props: TileProps) => {
   const {
      boardIndex,
      tileVal,
      board,
      imageUri,
      gesture,
      dragState,
      state,
      isTutorial,
      N,
   } = props;

   
   /**
    * Animates the tile's style based on its drag and selection state.
    * In tutorial mode, dims the source tile and highlights the valid targets.
    * When not in tutorial mode, adds a static transparent border with no animation.
    */
   const tileAnimatedStyle =
      useAnimatedStyle(() => {
         if (!isTutorial) {
            return {
               borderWidth: board.tileBorderWidth,
               borderColor: 'transparent',
            };
         }

         const dragging      = dragState.isDragging.value;
         const isSource      = dragging && dragState.dragBoardIndex.value  === boardIndex;
         const isValidTarget = dragging && dragState.dragTargetIndex.value === boardIndex;
         const isSelected    = !dragging && boardIndex === state.selected;
         const isAdjacent    = !dragging
                              && state.selected !== null
                              && isAdj(state.selected, boardIndex, N)
                              && boardIndex !== state.selected;

         return {
            opacity:     isSource ? 0.4 : 1,
            borderWidth: isValidTarget || isAdjacent || isSelected ? 3 : board.tileBorderWidth,
            borderColor: isValidTarget || isAdjacent
               ? '#4cd964'
               : isSelected
                  ? '#4a90ff'
                  : 'transparent',
         };
   });

   return (
      <GestureDetector key={boardIndex} gesture={gesture}>
         <Animated.View
            style={[
               styles.tile,
               {
                  width:  board.tileWidth,
                  height: board.tileHeight,
                  left:   tileX(boardIndex, board),
                  top:    tileY(boardIndex, board),
               },
               tileAnimatedStyle,
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
   ghost: {
      position:  'absolute',
      zIndex:    10,
      elevation: 10,
      overflow:  'hidden',
  },
});

export default PuzzleBoard;