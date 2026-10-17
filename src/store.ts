import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Metric } from './types';

type Preferences = {
  hydrated: boolean; preview: boolean; appearance: 'system' | 'light' | 'dark'; haptics: boolean;
  saved: string[]; lastBriefing: string | null; previewMetrics: Record<string, Metric>;
  set: (value: Partial<Omit<Preferences, 'set' | 'toggleSaved'>>) => void;
  toggleSaved: (id: string) => void;
};
export const usePreferences = create<Preferences>()(persist((set) => ({
  hydrated: false, preview: false, appearance: 'system', haptics: true,
  saved: [], lastBriefing: null, previewMetrics: {},
  set: value => set(value),
  toggleSaved: id => set(s => ({ saved: s.saved.includes(id) ? s.saved.filter(x => x !== id) : [...s.saved, id] })),
}), {
  name: 'minaara.preferences.v1', storage: createJSONStorage(() => AsyncStorage),
  partialize: ({ hydrated, set, toggleSaved, ...stored }) => stored,
  onRehydrateStorage: () => (state) => { if (state) state.set({ hydrated: true }); else usePreferences.setState({ hydrated: true }); },
}));
