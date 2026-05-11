/**
 * Root component. Manages navigation, current level, and player progress.
 */

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PuzzleBoard from './PuzzleBoard';

type Props = {}

const App = (props: Props) => {
   return (
      <GestureHandlerRootView>
         <PuzzleBoard />
      </GestureHandlerRootView>
   );
}



export default App;