/**
 * Root component. Manages navigation, current level, and player progress.
 */

import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PuzzleBoard from './PuzzleBoard';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ViewStyle } from 'react-native';
import LevelMenu from './LevelMenu';
import { Puzzle } from '../types/puzzle';
import { getPuzzle, getPuzzleSolved } from '@/services/puzzleService';
import { useBoard } from '../utils/puzzleUtils';
import { getDeviceId } from '@/services/deviceService';
import { getResumeLevel, setResumeLevel } from '@/services/resumeLevelService';

type Props = {}

interface State {
   level: number;
   puzzle: Puzzle;
   deviceId: string;
   showMenu: boolean;
   showButton: boolean;
   loading: boolean;
   solved: boolean;
}

interface LevelMenuBtnProps {
   level: number;
   onMenuOpen: () => void;
}

interface MessageBarProps {
   puzzle: Puzzle;
   solved: boolean;
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
   completion_message: '',
};

const App = (props: Props) => {
   const [state, setState] = useState<State>({
      level: 0,
      puzzle: EMPTY_PUZZLE,
      deviceId: '',
      showMenu: false,
      showButton: false,
      loading: true,
      solved: false,
   });

   // Runs once on mount: loads this device's ID and its last opened
   // level in parallel, then fetches that level, falling back to level 1
   // if none was recorded yet.
   useEffect(() => {
      const initializeApp = async () => {
         const [deviceId, resumeLevel] = await Promise.all([
            getDeviceId(),
            getResumeLevel(),
         ]);
         const level = resumeLevel ?? 1;
         const puzzle = await getPuzzle(level);
         setState({
            level,
            puzzle,
            deviceId,
            showMenu: false,
            showButton: false,
            loading: false,
            solved: false,
         });
      };

      initializeApp();
   }, []);

   // Fetches this device's solved status for the current puzzle whenever
   // it changes.
   useEffect(() => {
      if (!state.deviceId || !state.puzzle.id) {
         return;
      }

      let cancelled = false;

      const loadSolvedStatus = async () => {
         const solved = await getPuzzleSolved(state.deviceId, state.puzzle.id);
         if (!cancelled) {
            setState((prev) => ({ ...prev, solved }));
         }
      };

      loadSolvedStatus();

      return () => {
         cancelled = true;
      };
   }, [state.puzzle.id, state.deviceId]);

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
      setResumeLevel(level).catch((error) => {
         console.error('Failed to save level:', error);
      });
      setState({
         ...state,
         level,
         puzzle,
         showMenu: false,
      });
  };

   const onPuzzleSolved = () => {
      setState({
         ...state,
         showButton: true,
         solved: true,
      });
   }

   const onNextLevel = async () => {
      const nextLevel = state.level + 1;
      const puzzle = await getPuzzle(nextLevel);
      setResumeLevel(nextLevel).catch((error) => {
         console.error('Failed to save level:', error);
      });
      setState({
         ...state,
         level: nextLevel,
         puzzle,
         showButton: false,
         solved: false,
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

   if (state.loading) {
      return (
         <GestureHandlerRootView style={styles.root}>
            <View style={containerStyle} />
         </GestureHandlerRootView>
      );
   }

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
                  <LevelMenu
                     deviceId={state.deviceId}
                     onPuzzleSelected={onPuzzleSelected}
                  />
               </View>
            ) : (
               <>
                  <View style={puzzleContainerStyle}>
                     <PuzzleBoard
                        puzzle={state.puzzle}
                        board={board}
                        deviceId={state.deviceId}
                        onPuzzleSolved={onPuzzleSolved}
                     />
                  </View>
                  <View style={messageBarStyle}>
                     <MessageBar
                        puzzle={state.puzzle}
                        solved={state.solved}
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
   const levelText = "Level " + level;

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
 * Renders a message bar that shows hints while a puzzle is in progress.
 * Once a puzzle is completed, shows a congratulatory note and a button to
 * advance to the next level.
 * @param puzzle      - The current puzzle
 * @param solved      - Whether the current puzzle has been solved
 * @param showButton  - Whether to show the next level button
 * @param onNextLevel - Callback fired when the next level button is pressed
 */
const MessageBar = ({ puzzle, solved, showButton, onNextLevel }: MessageBarProps) => {
   let displayTitle;
   let displayMessage;

   if (solved) {
      displayMessage = puzzle.completion_message;
   } else if (puzzle.level_number === 1) {
      displayTitle = "How to play";
      displayMessage = "Drag a tile into another tile or click on two tiles to swap them";
   } else {
      displayMessage = "";
   }

   return (
      <>
         <Text style={styles.messageTitle}>{displayTitle}</Text>
         <Text style={styles.message}>{displayMessage}</Text>
         {showButton && (
            <TouchableOpacity style={styles.nextLevelBtn} onPress={onNextLevel}>
               <Text style={styles.nextLevelText}>Next Level →</Text>
            </TouchableOpacity>
         )}
      </>
   );
};

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
   messageTitle: {
      fontSize:          15,
      color:             '#333',
      fontWeight:        'bold',
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