/**
 * Root component. Manages navigation, current level, and player progress.
 */

import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PuzzleBoard from './PuzzleBoard';
import { getImage, Image } from '@/utils/imageUtils';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {}

interface State {
   level: number;
   image: Image;
   message: string;
   showButton: boolean;
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

   return (
      <GestureHandlerRootView>
         <PuzzleBoard
            level={state.level}
            onPuzzleSolved={onPuzzleSolved}
         />
         <MessageBar
            message={state.message}
            showButton={state.showButton}
            onNextLevel={onNextLevel}
         />
      </GestureHandlerRootView>
   );
}

/**
 * Renders a message bar with a text message and an optional next level button.
 * @param message     - The message text to display
 * @param showButton  - Whether to show the next level button
 * @param onNextLevel - Callback fired when the next level button is pressed
 */
const MessageBar = ({ message, showButton, onNextLevel }: MessageBarProps) => (
  <View style={styles.messageBar}>
      <Text style={styles.message}>{message}</Text>
      {showButton && (
         <TouchableOpacity style={styles.button} onPress={onNextLevel}>
            <Text style={styles.buttonText}>Next Level →</Text>
         </TouchableOpacity>
      )}
  </View>
);

const styles = StyleSheet.create({
   messageBar: {
      alignItems:        'center',
      paddingVertical:   4,
   },
   message: {
      fontSize:    15,
      color:       '#333',
   },
   button: {
      backgroundColor:   '#4cd964',
      paddingVertical:   8,
      paddingHorizontal: 24,
      marginLeft:        'auto',
      marginRight:       0,
      borderRadius:      8,
   },
   buttonText: {
      fontSize:   15,
      fontWeight: '700',
      color:      '#fff',
   },
});

export default App;