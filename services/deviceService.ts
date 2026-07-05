/**
 * deviceService.ts
 *
 * Generates and persists a random identifier unique to this app install,
 * used to scope puzzle progress per device (see puzzle_progress in
 * schema.sql). This is not tied to Supabase Auth and is not a secret —
 * it's just a label distinguishing one install from another.
 *
 * The ID is created once on first use and cached in AsyncStorage. If the
 * app is uninstalled and reinstalled, a new ID is generated and any
 * previous progress becomes unreachable (but is not deleted from the
 * database).
 *
 * Dependencies:
 *   npm install @react-native-async-storage/async-storage expo-crypto
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

const DEVICE_ID_STORAGE_KEY = 'scrambled:device_id';

let cachedDeviceId: string | null = null;

/**
 * Returns this install's persistent device ID, creating and storing one
 * on first call if it doesn't exist yet.
 */
const getDeviceId = async (): Promise<string> => {
   if (cachedDeviceId) {
      return cachedDeviceId;
   }

   const existingId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);

   if (existingId) {
      cachedDeviceId = existingId;
      return existingId;
   }

   const newId = randomUUID();
   await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newId);
   cachedDeviceId = newId;
   return newId;
};

export { getDeviceId };