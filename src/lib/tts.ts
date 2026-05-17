export function getBestVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  return voices.find(v => v.lang.startsWith('en-US') && v.localService)
    || voices.find(v => v.lang.startsWith('en'));
}

export function speak(text: string, onEnd?: () => void): void {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.8;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  const voice = getBestVoice();
  if (voice) utterance.voice = voice;
  if (onEnd) utterance.onend = onEnd;
  speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  speechSynthesis.cancel();
}

// Preload voices (iOS needs user gesture first)
export function preloadVoices(): void {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
  };
}
