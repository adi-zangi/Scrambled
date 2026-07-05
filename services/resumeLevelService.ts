/**
 * resumeLevelService.ts
 *
 * Persists the most recently opened level number on this device, so the
 * app can resume the same puzzle on next launch instead of always
 * starting at level 1.
 *
 * Dependencies:
 *   npm install @react-native-async-storage/async-storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RESUME_LEVEL_STORAGE_KEY = 'scrambled:last_level';

/**
 * Returns the level to resume on this device, or null if none has been
 * recorded yet (e.g. first launch).
 */
const getResumeLevel = async (): Promise<number | null> => {
   const stored = await AsyncStorage.getItem(RESUME_LEVEL_STORAGE_KEY);
   return stored !== null ? parseInt(stored, 10) : null;
};

/**
 * Saves the given level number as the level to resume on this device.
 */
const setResumeLevel = async (level: number): Promise<void> => {
   await AsyncStorage.setItem(RESUME_LEVEL_STORAGE_KEY, level.toString());
};

export { getResumeLevel, setResumeLevel };