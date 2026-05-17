import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('TTS Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get the best English voice', async () => {
    const { getBestVoice } = await import('@/lib/tts');
    const voice = getBestVoice();
    expect(voice).toBeDefined();
    expect(voice?.lang.startsWith('en')).toBe(true);
  });

  it('should cancel then speak', async () => {
    const { speak } = await import('@/lib/tts');
    speak('hello');
    expect(speechSynthesis.cancel).toHaveBeenCalled();
    expect(speechSynthesis.speak).toHaveBeenCalled();
  });

  it('should use slower rate for children', async () => {
    const { speak } = await import('@/lib/tts');
    speak('test');
    const call = speechSynthesis.speak.mock.calls[0][0];
    expect(call.rate).toBe(0.8);
  });

  it('should stop speaking', async () => {
    const { stopSpeaking } = await import('@/lib/tts');
    stopSpeaking();
    expect(speechSynthesis.cancel).toHaveBeenCalled();
  });
});
