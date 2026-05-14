/**
 * Root component. Manages navigation, current level, and player progress.
 */

import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PuzzleBoard from './PuzzleBoard';
import { getImage, PuzzleImage } from '@/utils/imageUtils';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ViewStyle } from 'react-native';
import { getGridSize, useBoard } from '@/utils/puzzleUtils';

type Props = {}

interface State {
   level: number;
   image: PuzzleImage;
   message: string;
   showButton: boolean;
}

interface LevelMenuBtnProps {
   level: number;
}

interface MessageBarProps {
   message:        string;
   showButton:     boolean;
   onNextLevel:    () => void;
}

const App = (props: Props) => {
   const [state, setState] = useState<State>({
      level: 0,
      image: getImage(0),
      message: "Drag or click two adjacent tiles to swap",
      showButton: false,
   });

   const gridSize = getGridSize(state.level);
   const board = useBoard(state.image, gridSize);

   const { width } = useWindowDimensions();

   const onPuzzleSolved = () => {
      setState({
         ...state,
         message: "It's " + state.image.desc.toLowerCase() + "!",
         showButton: true,
      });
   }

   const onNextLevel = () => {
      setState({
         ...state,
         level: state.level + 1,
         image: getImage(state.level + 1),
         message: "",
         showButton: false,
      });
   }

   const containerStyle: ViewStyle = {
      flex:          1,
      flexDirection: 'row',
   };

   const topBarStyle: ViewStyle = {
      width:          (width - board.boardWidth) / 2,
      height:         '100%',
      paddingTop:     32,
      paddingLeft:    32,
      alignItems:     'flex-start',
      justifyContent: 'flex-start',
      flexShrink:     0,
   };

   const puzzleContainerStyle: ViewStyle = {
      justifyContent: 'center',
      alignItems:     'center',
   };

   const messageBarStyle: ViewStyle = {
      width:          (width - board.boardWidth) / 2,
      height:         '100%',
      paddingRight:   56,
      alignItems:     'flex-start',
      justifyContent: 'center',
      flexShrink:     0,
   };

   return (
      <GestureHandlerRootView style={styles.root}>
         <View style={containerStyle}>
            <View style={topBarStyle}>
               <LevelMenuButton
                  level={state.level}
               />
            </View>
            <View style={puzzleContainerStyle}>
               <PuzzleBoard
                  level={state.level}
                  image={state.image}
                  board={board}
                  gridSize={gridSize}
                  onPuzzleSolved={onPuzzleSolved}
               />
            </View>
            <View style={messageBarStyle}>
               <MessageBar
                  message={state.message}
                  showButton={state.showButton}
                  onNextLevel={onNextLevel}
               />
            </View>
         </View>
      </GestureHandlerRootView>
   );
}

/**
 * Renders a button displaying the current level number.
 * Tapping it opens the level select screen.
 * @param level   - The current level number (0-based)
 * @param onPress - Callback fired when the button is pressed
 */
const LevelMenuButton = ({ level }: LevelMenuBtnProps) => {
   const levelText = level === 0 ? "Tutorial" : "Level " + (level + 1);

   return (
      <TouchableOpacity
         style={styles.levelMenuBtn}
         accessibilityLabel={`${levelText}, tap to select a level`}
      >
         <Text style={styles.levelMenuIcon}>⊞</Text>
         <Text style={styles.levelMenuText}>{levelText}</Text>
      </TouchableOpacity>
   );
}

/**
 * Renders a message bar with a text message and an optional next level button.
 * @param message     - The message text to display
 * @param showButton  - Whether to show the next level button
 * @param onNextLevel - Callback fired when the next level button is pressed
 */
const MessageBar = ({ message, showButton, onNextLevel }: MessageBarProps) => (
   <>
      <Text style={styles.message}>{message}</Text>
      {showButton && (
         <TouchableOpacity style={styles.nextLevelBtn} onPress={onNextLevel}>
            <Text style={styles.nextLevelText}>Next Level →</Text>
         </TouchableOpacity>
      )}
   </>
);

const styles = StyleSheet.create({
   root: {
      flex: 1,
   },
   levelMenuBtn: {
      flexDirection:     'row',
      alignItems:        'center',
      alignSelf:         'flex-start',
      gap:               8,
      backgroundColor:   '#f0f0f0',
      borderWidth:       1,
      borderColor:       '#ddd',
      borderRadius:      8,
      paddingVertical:   8,
      paddingHorizontal: 14,
   },
   levelMenuIcon: {
      fontSize: 16,
      color:    '#333',
   },
   levelMenuText: {
      fontSize:   14,
      fontWeight: '500',
      color:      '#333',
   },
   message: {
      fontSize:          15,
      color:             '#333',
      paddingVertical:   16,
      textAlign:         'center',
      width:             '100%',
   },
   nextLevelBtn: {
      backgroundColor:   '#4cd964',
      paddingVertical:   8,
      paddingHorizontal: 24,
      marginLeft:        'auto',
      marginRight:       0,
      borderRadius:      8,
   },
   nextLevelText: {
      fontSize:   15,
      fontWeight: '700',
      color:      '#fff',
   },
});

export default App;