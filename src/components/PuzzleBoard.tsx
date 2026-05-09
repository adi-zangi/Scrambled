import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { shuffle, tileX, tileY, useBoard } from '@/utils/puzzleUtils';

type Props = {}

const PuzzleBoard = (props: Props) => {
   const N = 4;

   const imageUri = 'https://res.cloudinary.com/scrambled/image/upload/v1778374693/otter_unszkv.png';

   const board = useBoard(N);

   const [state, setState] = useState(() => shuffle([...Array(N*N).keys()], N));

   return (
      <View style={[
         styles.board,
         {
            width: board.boardWidth,
            height: board.boardHeight,
         }
      ]}>
         {state.map((tileVal, tileIndex) => (
            <TouchableOpacity
               key={tileIndex}
               //onPress={() => handlePress(tileIndex)}
               style={[
                  styles.tile,
                  {
                     width: board.tileWidth,
                     height: board.tileHeight,
                     left: tileX(tileIndex, board),
                     top:  tileY(tileIndex, board),
                     borderWidth: board.tileBoarderWidth,
                     borderColor: 'transparent',
                     //borderColor: tileIndex === selected ? '#4a90ff' : 'transparent',
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