export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private onWaveUpdate: ((data: Uint8Array) => void) | null = null;

  async start(onWaveUpdate?: (data: Uint8Array) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioChunks = [];

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

    this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.audioChunks.push(e.data);
    };

    // Waveform analysis
    if (onWaveUpdate) {
      this.onWaveUpdate = onWaveUpdate;
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      this.startWaveformLoop();
    }

    this.mediaRecorder.start();
  }

  private startWaveformLoop() {
    if (!this.analyser || !this.onWaveUpdate) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    const loop = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(data);
      this.onWaveUpdate!(data);
      requestAnimationFrame(loop);
    };
    loop();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: this.mediaRecorder!.mimeType || 'audio/webm' });
        this.stream?.getTracks().forEach(t => t.stop());
        this.audioContext?.close();
        this.mediaRecorder = null;
        this.stream = null;
        this.audioContext = null;
        this.analyser = null;
        this.onWaveUpdate = null;
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  // Extract waveform from audio blob for display
  static async extractWaveformData(blob: Blob): Promise<number[]> {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const rawData = audioBuffer.getChannelData(0);
    const samples = 50;
    const blockSize = Math.floor(rawData.length / samples);
    const waveform: number[] = [];
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j]);
      }
      waveform.push(sum / blockSize);
    }
    audioContext.close();
    return waveform;
  }
}
