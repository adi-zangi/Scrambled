import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { isAdj, shuffle, tileX, tileY, useBoard } from '@/utils/puzzleUtils';

interface State {
   boardArray: number[];
   selected: number | null;
   solved: boolean;
}

type Props = {}

const PuzzleBoard = (props: Props) => {
   const N = 4;

   const imageUri = 'https://res.cloudinary.com/scrambled/image/upload/v1778374693/otter_unszkv.png';

   const board = useBoard(N);

   const [state, setState] = useState<State>({
      boardArray: shuffle([...Array(N*N).keys()], N),
      selected: null,
      solved: false,
   });

   /**
    * Handles a tile press during the puzzle game.
    * Highlights the selected tile and swaps the two last selected tiles
    * if they are adjacent.
    * @param boardIndex - The board index of the pressed tile (0 to N*N-1)
    */
   const handlePress = (boardIndex: number) => {
      if (!state.solved) {
         let selected = state.selected;
         let newBoard = [...state.boardArray];
         let solved = false;
         if (selected === null) {
            selected = boardIndex;
         } else if (selected === boardIndex) {
            selected = null;
         } else if (isAdj(selected, boardIndex, N)) {
            [newBoard[selected], newBoard[boardIndex]] = [newBoard[boardIndex], newBoard[selected]];
            selected = null;
            if (newBoard.every((v, i) => v === i)) {
               solved = true;
            }
         } else {
            selected = boardIndex;
         }
         setState({
            ...state,
            boardArray: newBoard,
            solved: solved,
            selected: selected,
         });
      }
   }

   return (
      <View style={[
         styles.board,
         {
            width: board.boardWidth,
            height: board.boardHeight,
         }
      ]}>
         {state.boardArray.map((tileVal, tileIndex) => (
            <TouchableOpacity
               key={tileIndex}
               onPress={() => handlePress(tileIndex)}
               style={[
                  styles.tile,
                  {
                     width: board.tileWidth,
                     height: board.tileHeight,
                     left: tileX(tileIndex, board),
                     top:  tileY(tileIndex, board),
                     borderWidth: board.tileBoarderWidth,
                     borderColor: tileIndex === state.selected ? '#4a90ff' : 'transparent',
                  }
               ]}
            >
               <Image 
                  key={tileIndex}
                  source={{ uri: imageUri }}
                  style={[
                     {
                        width: board.boardWidth,
                        height: board.boardHeight,
                        position: 'absolute',
                        left: -tileX(tileVal, board),
                        top:  -tileY(tileVal, board),
                     }
                  ]}
               />
        </TouchableOpacity>
         ))}
      </View>
   );
}

const styles = StyleSheet.create({
   board: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 4,
   },
   tile: {
      position: 'absolute',
      overflow: 'hidden',
   },
});

export default PuzzleBoard;