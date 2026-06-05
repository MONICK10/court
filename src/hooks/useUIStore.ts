import { create } from 'zustand'
import { CourtMood } from '@/types'

export const THEME_CONFIG: Record<CourtMood, {
  bg: string
  accent: string
  glowRgb: string
  judgeLabel: string
  label: string
  scrollThumb: string
}> = {
  serious: {
    bg: '#0a0a0f',
    accent: '#c0a060',
    glowRgb: '192, 160, 96',
    judgeLabel: 'THE HONOURABLE COURT',
    label: 'Serious',
    scrollThumb: '#c0a060',
  },
  savage: {
    bg: '#0f0005',
    accent: '#ff3030',
    glowRgb: '255, 48, 48',
    judgeLabel: 'NO MERCY COURT',
    label: 'Savage',
    scrollThumb: '#ff3030',
  },
  drama: {
    bg: '#05000f',
    accent: '#9060ff',
    glowRgb: '144, 96, 255',
    judgeLabel: 'THE DRAMATIC COURT',
    label: 'Drama',
    scrollThumb: '#9060ff',
  },
  funny: {
    bg: '#0a0f00',
    accent: '#ffcc00',
    glowRgb: '255, 204, 0',
    judgeLabel: 'THE COMEDY COURT',
    label: 'Funny',
    scrollThumb: '#ffcc00',
  },
}

interface UIState {
  mood: CourtMood
  isMuted: boolean
  objectionsA: number
  objectionsB: number
  setMood: (mood: CourtMood) => void
  toggleMute: () => void
  useObjection: (person: 'A' | 'B') => boolean
  resetObjections: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  mood: 'serious',
  isMuted: false,
  objectionsA: 2,
  objectionsB: 2,

  setMood: (mood) => set({ mood }),

  toggleMute: () => set(s => ({ isMuted: !s.isMuted })),

  useObjection: (person) => {
    const key = person === 'A' ? 'objectionsA' : 'objectionsB'
    const current = get()[key]
    if (current <= 0) return false
    set({ [key]: current - 1 } as Partial<UIState>)
    return true
  },

  resetObjections: () => set({ objectionsA: 2, objectionsB: 2 }),
}))
