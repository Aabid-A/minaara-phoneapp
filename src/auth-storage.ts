import * as SecureStore from 'expo-secure-store';
// Session tokens can exceed SecureStore's single-value limit. Use 1800-character
// chunks; a committed manifest appears only after every chunk has been written.
const CHUNK_SIZE = 1800;
type Manifest = { generation: string; count: number };
async function manifest(key: string): Promise<Manifest | null> {
  const value = await SecureStore.getItemAsync(key);
  if (!value) return null;
  try { const parsed = JSON.parse(value); return typeof parsed.generation === 'string' && Number.isInteger(parsed.count) && parsed.count > 0 && parsed.count < 100 ? parsed : null; } catch { return null; }
}
async function removeChunks(key: string, value: Manifest | null) {
  if (value) await Promise.all(Array.from({ length: value.count }, (_, i) => SecureStore.deleteItemAsync(`${key}.${value.generation}.${i}`)));
}
export const sessionStorage = {
  async getItem(key: string) {
    if (process.env.EXPO_OS === 'web') return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    const value = await manifest(key);
    if (!value) return null;
    const chunks = await Promise.all(Array.from({ length: value.count }, (_, i) => SecureStore.getItemAsync(`${key}.${value.generation}.${i}`)));
    return chunks.some(x => x === null) ? null : chunks.join('');
  },
  async setItem(key: string, value: string) {
    if (process.env.EXPO_OS === 'web') { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); return; }
    const previous = await manifest(key);
    const generation = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const count = Math.ceil(value.length / CHUNK_SIZE);
    const next = { generation, count };
    try {
      await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.setItemAsync(`${key}.${generation}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE))));
      await SecureStore.setItemAsync(key, JSON.stringify(next));
    } catch (error) { await removeChunks(key, next); throw error; }
    await removeChunks(key, previous);
  },
  async removeItem(key: string) {
    if (process.env.EXPO_OS === 'web') { if (typeof window !== 'undefined') window.localStorage.removeItem(key); return; }
    const previous = await manifest(key);
    await SecureStore.deleteItemAsync(key);
    await removeChunks(key, previous);
  },
};
