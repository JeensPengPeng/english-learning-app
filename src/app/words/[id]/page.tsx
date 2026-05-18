'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import WaveformCanvas from '@/components/WaveformCanvas';
import { RecordingManager } from '@/lib/recording';
import { speak, stopSpeaking } from '@/lib/tts';
import { getWord, updateWord, addRecording, getRecordingsByWord, MAX_RECORDINGS_PER_WORD, deleteRecording, getDB } from '@/lib/db';
import type { Word, Recording } from '@/lib/db';

export default function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [word, setWord] = useState<Word | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState<Uint8Array | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recorder, setRecorder] = useState<RecordingManager | null>(null);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const w = await getWord(id);
    if (!w) { router.back(); return; }
    setWord(w);
    const recs = await getRecordingsByWord(id);
    setRecordings(recs.sort((a, b) => b.createdAt - a.createdAt));
    setIsLoading(false);
  }

  async function handleRecording() {
    if (isRecording && recorder) {
      // Stop recording
      try {
        setIsRecording(false);
        const blob = await recorder.stop();
        if (blob.size === 0) return;

        // Save recording
        const rec: Recording = {
          id: crypto.randomUUID(),
          wordId: id,
          type: 'practice',
          audioData: blob,
          createdAt: Date.now(),
        };
        await addRecording(rec);

        // Enforce max recordings
        const allRecs = await getRecordingsByWord(id);
        if (allRecs.length > MAX_RECORDINGS_PER_WORD) {
          allRecs.sort((a, b) => a.createdAt - b.createdAt);
          const excess = allRecs.length - MAX_RECORDINGS_PER_WORD;
          const db = await getDB();
          for (let i = 0; i < excess; i++) {
            await db.delete('recordings', allRecs[i].id);
          }
        }

        await loadData();
      } catch (err) {
        console.error('Failed to stop recording:', err);
        setIsRecording(false);
        setIsInitializing(false);
      }
      setRecorder(null);
    } else if (!isRecording && !isInitializing) {
      // Start recording
      setIsInitializing(true);
      try {
        const mgr = new RecordingManager();
        await mgr.start((data) => {
          setWaveform(new Uint8Array(data));
        });
        setRecorder(mgr);
        setIsInitializing(false);
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start recording:', err);
        setIsInitializing(false);
        alert('无法访问麦克风，请确保已授予录音权限。\n\n注意：手机需要使用 HTTPS 连接。');
      }
    }
  }

  async function playRecording(rec: Recording) {
    setIsPlaying(true);
    const audio = new Audio(URL.createObjectURL(rec.audioData));
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    await audio.play();
  }

  async function handleDeleteRecording(recId: string) {
    await deleteRecording(recId);
    loadData();
  }

  const stars = word?.masteryLevel || 0;

  if (isLoading || !word) {
    return <div className="flex flex-col min-h-screen pb-20"><div className="px-4 mt-12 text-center text-gray-400">加载中...</div></div>;
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="bg-gradient-to-r from-sky-500 to-blue-500 text-white px-6 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-lg mb-2">← 返回</button>
        <h1 className="text-3xl font-bold">{word.text}</h1>
        {word.phonetic && <p className="text-sky-100 mt-1">{word.phonetic}</p>}
        <div className="flex gap-1 mt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={`text-xl ${i < stars ? 'text-amber-300' : 'text-white/40'}`}>
              {i < stars ? '★' : '☆'}
            </span>
          ))}
        </div>
      </header>

      <div className="px-4 mt-6 space-y-4">
        {/* Play standard pronunciation */}
        <button
          onClick={() => { stopSpeaking(); speak(word.text); }}
          className="w-full bg-emerald-500 text-white rounded-2xl p-5 shadow-md active:bg-emerald-600 transition-colors"
        >
          <span className="text-2xl">🔊</span>
          <span className="text-xl font-semibold ml-3">播放标准发音</span>
        </button>

        {/* Recording area */}
        <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${isRecording ? 'border-red-400 recording-pulse' : 'border-sky-200'}`}>
          <WaveformCanvas data={isRecording ? waveform : null} color={isRecording ? '#ef4444' : '#10b981'} height={60} />
          <button
            onClick={handleRecording}
            disabled={isInitializing}
            className={`w-full mt-4 rounded-2xl p-4 text-xl font-semibold shadow-md transition-colors ${
              isInitializing
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : isRecording
                  ? 'bg-red-500 text-white active:bg-red-600'
                  : 'bg-sky-500 text-white active:bg-sky-600'
            }`}
          >
            {isInitializing ? '🎤 正在启动...' : isRecording ? '⏹️ 停止录音' : '🎤 开始录音'}
          </button>
        </div>

        {/* Previous recordings */}
        {recordings.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">你的录音</h3>
            <div className="space-y-2">
              {recordings.map((rec, i) => (
                <div key={rec.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                  <button
                    onClick={() => playRecording(rec)}
                    className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center active:bg-sky-200"
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  <span className="flex-1 text-sm text-gray-600">录音 {i + 1}</span>
                  <button
                    onClick={() => handleDeleteRecording(rec.id)}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-sm active:bg-red-100"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
