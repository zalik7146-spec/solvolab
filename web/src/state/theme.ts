export type Mood = 'calm' | 'focused' | 'joyful' | 'reflective' | 'low'

export const moodList: Mood[] = ['calm', 'focused', 'joyful', 'reflective', 'low']

export function moodColor(mood: Mood): string {
  switch (mood) {
    case 'calm': return 'from-sky-400/20 to-sky-200/10 text-sky-700 dark:text-sky-300'
    case 'focused': return 'from-indigo-400/20 to-indigo-200/10 text-indigo-700 dark:text-indigo-300'
    case 'joyful': return 'from-orange-400/20 to-orange-200/10 text-orange-700 dark:text-orange-300'
    case 'reflective': return 'from-violet-400/20 to-violet-200/10 text-violet-700 dark:text-violet-300'
    case 'low': return 'from-blue-300/15 to-blue-200/10 text-blue-700 dark:text-blue-300'
  }
}

import { create } from 'zustand'

interface ThemeState {
  mood: Mood
  setMood: (mood: Mood) => void
}

export const useTheme = create<ThemeState>((set) => ({
  mood: 'calm',
  setMood: (mood) => set({ mood }),
}))