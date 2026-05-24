/**
 * Root component. Manages navigation, current level, and player progress.
 */

import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PuzzleBoard from './PuzzleBoard';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ViewStyle } from 'react-native';
import PuzzleMenu from './PuzzleMenu';
import { Puzzle } from '@/types/puzzle';
import { getPuzzle } from '../../services/puzzleService';
import { useBoard } from '@/utils/puzzleUtils';

type Props = {}

interface State {
   level: number;
   puzzle: Puzzle;
   message: string;
   showMenu: boolean;
   showButton: boolean;
}

interface LevelMenuBtnProps {
   level: number;
   onMenuOpen: () => void;
}

interface MessageBarProps {
   message: string;
   showButton: boolean;
   onNextLevel: () => void;
}

const EMPTY_PUZZLE: Puzzle = {
  id: '',
  level_number: 0,
  image_url: '',
  image_width: 0,
  image_height: 0,
  grid_size: 0,
  solved: false,
  progress: [],
  completion_message: '',
};

const App = (props: Props) => {
   const [state, setState] = useState<State>({
      level: 0,
      puzzle: EMPTY_PUZZLE,
      message: "",
      showMenu: false,
      showButton: false,
   });

   useEffect(() => {
      const initializeApp = async () => {
         const puzzle = await getPuzzle(1);
         setState({
            level: 1,
            puzzle,
            message: "Drag or click two adjacent tiles to swap",
            showMenu: false,
            showButton: false,
         });
      };

      initializeApp();
   }, []);

   const board = useBoard(state.puzzle);

   const { width } = useWindowDimensions();

   const onMenuOpen = () => {
      setState({
         ...state,
         showMenu: !state.showMenu,
      });
   }

   const onPuzzleSelected = async (level: number) => {
      const puzzle = await getPuzzle(level);
      setState({
         ...state,
         level,
         puzzle,
         message: level === 1 ? "Drag or click two adjacent tiles to swap" : "",
         showMenu: false,
      });
  };

   const onPuzzleSolved = () => {
      setState({
         ...state,
         message: state.puzzle?.completion_message.toLowerCase(),
         showButton: true,
      });
   }

   const onNextLevel = async () => {
      const nextLevel = state.level + 1;
      const puzzle = await getPuzzle(nextLevel);
      setState({
         ...state,
         level: nextLevel,
         puzzle,
         message: "",
         showButton: false,
      });
  };

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

   const puzzleMenuStyle: ViewStyle = {
      width:  board.boardWidth + ((width - board.boardWidth) / 2),
      height: '100%',
   };

   return (
      <GestureHandlerRootView style={styles.root}>
         <View style={containerStyle}>
            <View style={topBarStyle}>
               <LevelMenuButton
                  level={state.level}
                  onMenuOpen={onMenuOpen}
               />
            </View>
           {state.showMenu ? (
               <View style={puzzleMenuStyle}>
                  <PuzzleMenu
                     onPuzzleSelected={onPuzzleSelected}
                  />
               </View>
            ) : (
               <>
                  <View style={puzzleContainerStyle}>
                     <PuzzleBoard
                        puzzle={state.puzzle}
                        board={board}
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
               </>
            )}
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
const LevelMenuButton = ({ level, onMenuOpen }: LevelMenuBtnProps) => {
   const levelText = level === 0 ? "Tutorial" : "Level " + level;

   return (
      <TouchableOpacity
         style={styles.levelMenuBtn}
         onPress={onMenuOpen}
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