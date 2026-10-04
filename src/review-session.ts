import { create } from 'zustand';
import type { Question } from './types';
export const useReviewSession = create<{ questions: Question[]; index: number; finished: boolean; start: (questions: Question[]) => void; advance: () => void; clear: () => void }>(set => ({
  questions: [], index: 0, finished: false,
  start: questions => set({ questions, index: 0, finished: false }),
  advance: () => set(s => ({ index: s.index + 1, finished: s.index + 1 >= s.questions.length })),
  clear: () => set({ questions: [], index: 0, finished: false }),
}));
