import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createPendingAttempts } from './pending-attempt';

// Compact IDs-only records fit a single SecureStore value. No auth credentials.
// Web storage failures throw rather than silently dropping the pending request.
const project = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://unconfigured.invalid').hostname.replace(/[^a-zA-Z0-9._-]/g, '_');
const scopedKey = (key: string) => `${project}.${key}`;
export const pendingAttempts = createPendingAttempts({
  async getItem(key) { return Platform.OS === 'web' ? window.localStorage.getItem(scopedKey(key)) : SecureStore.getItemAsync(scopedKey(key)); },
  async setItem(key,value) { if (Platform.OS === 'web') window.localStorage.setItem(scopedKey(key),value); else await SecureStore.setItemAsync(scopedKey(key),value); },
  async removeItem(key) { if (Platform.OS === 'web') window.localStorage.removeItem(scopedKey(key)); else await SecureStore.deleteItemAsync(scopedKey(key)); },
});
