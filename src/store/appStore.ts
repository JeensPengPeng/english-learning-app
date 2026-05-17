import { create } from 'zustand';

interface AppState {
  // Navigation
  currentTab: string;
  setCurrentTab: (tab: string) => void;

  // OCR
  ocrProgress: number;
  setOCRProgress: (p: number) => void;
  ocrResults: string[];
  setOCRResults: (results: string[]) => void;

  // Recording state
  isRecording: boolean;
  isPlaying: boolean;
  currentPlayingWord: string | null;
  setIsRecording: (v: boolean) => void;
  setIsPlaying: (v: boolean) => void;
  setCurrentPlayingWord: (id: string | null) => void;

  // Review session
  reviewSession: {
    words: { id: string; text: string; masteryLevel: number }[];
    currentIndex: number;
    results: { wordId: string; correct: boolean }[];
  } | null;
  startReview: (words: { id: string; text: string; masteryLevel: number }[]) => void;
  nextReviewWord: (correct: boolean) => void;
  endReview: () => void;

  // Waveform data for real-time display
  waveform: Uint8Array | null;
  setWaveform: (data: Uint8Array | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: 'home',
  setCurrentTab: (tab) => set({ currentTab: tab }),

  ocrProgress: 0,
  setOCRProgress: (p) => set({ ocrProgress: p }),
  ocrResults: [],
  setOCRResults: (results) => set({ ocrResults: results }),

  isRecording: false,
  isPlaying: false,
  currentPlayingWord: null,
  setIsRecording: (v) => set({ isRecording: v }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setCurrentPlayingWord: (id) => set({ currentPlayingWord: id }),

  reviewSession: null,
  startReview: (words) => set({
    reviewSession: { words, currentIndex: 0, results: [] }
  }),
  nextReviewWord: (correct) => set((state) => {
    if (!state.reviewSession) return state;
    const { words, currentIndex, results } = state.reviewSession;
    const currentWord = words[currentIndex];
    results.push({ wordId: currentWord.id, correct });
    const nextIndex = currentIndex + 1;
    if (nextIndex >= words.length) {
      return { reviewSession: { words, currentIndex: nextIndex, results } };
    }
    return { reviewSession: { words, currentIndex: nextIndex, results } };
  }),
  endReview: () => set({ reviewSession: null }),

  waveform: null,
  setWaveform: (data) => set({ waveform: data }),
}));
