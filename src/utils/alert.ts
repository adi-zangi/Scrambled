/**
 * Shared helper for showing simple alert dialogs across the app.
 */

import { Alert, Platform } from 'react-native';

/**
 * Shows a simple alert dialog with a message, using the right
 * implementation for the current platform.
 */
const showAlert = (title: string, message: string): void => {
   if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
   } else {
      Alert.alert(title, message);
   }
};

export { showAlert };