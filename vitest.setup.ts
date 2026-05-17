/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// Mock SpeechSynthesis
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockGetVoices = vi.fn(() => [
  { lang: 'en-US', localService: true, name: 'English US', voiceURI: 'en-US-1' },
  { lang: 'zh-CN', localService: true, name: 'Chinese', voiceURI: 'zh-CN-1' },
]);

vi.stubGlobal('speechSynthesis', {
  speak: mockSpeak,
  cancel: mockCancel,
  getVoices: mockGetVoices,
  onvoiceschanged: null,
});

vi.stubGlobal('SpeechSynthesisUtterance', class {
  text: string;
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
  voice: any;
  onend: (() => void) | null = null;
  constructor(text: string) { this.text = text; this.lang = 'en-US'; this.rate = 0.8; this.pitch = 1.0; this.volume = 1.0; }
});
