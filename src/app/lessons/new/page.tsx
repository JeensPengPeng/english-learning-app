'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { recognizeLines } from '@/lib/ocr';
import { addLesson, addWord } from '@/lib/db';
import BottomNav from '@/components/BottomNav';

export default function NewLessonPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recognizedLines, setRecognizedLines] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [step, setStep] = useState<'capture' | 'review'>('capture');

  const handleImageCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      processImage(file);
    };
    reader.readAsDataURL(file);
  }, []);

  async function processImage(file: File) {
    setIsProcessing(true);
    setProgress(0);
    try {
      const lines = await recognizeLines(file, (p) => setProgress(p));
      const texts = lines.map(l => l.text);
      setRecognizedLines(texts);
      setStep('review');
    } catch (err) {
      console.error('OCR failed:', err);
      alert('识别失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }

  function removeLine(index: number) {
    setRecognizedLines(prev => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, value: string) {
    setRecognizedLines(prev => prev.map((l, i) => i === index ? value : l));
  }

  async function handleConfirm() {
    if (!title.trim()) {
      alert('请输入课程名称');
      return;
    }

    const lessonId = crypto.randomUUID();
    await addLesson({
      id: lessonId,
      title: title.trim(),
      date,
      wordIds: [],
      createdAt: Date.now(),
    });

    // Add each line as a word
    const wordIds: string[] = [];
    for (const line of recognizedLines) {
      if (line.trim().length === 0) continue;
      const wordId = crypto.randomUUID();
      await addWord({
        id: wordId,
        text: line.trim(),
        sourceLesson: lessonId,
        createdAt: Date.now(),
        reviewCount: 0,
        masteryLevel: 0,
      });
      wordIds.push(wordId);
    }

    router.push(`/lessons/${lessonId}`);
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-lg mb-2">← 返回</button>
        <h1 className="text-2xl font-bold">📷 录入新课程</h1>
      </header>

      <div className="px-4 mt-4">
        {step === 'capture' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">课程名称</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：Unit 3 - Animals"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">上课日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full bg-emerald-500 text-white rounded-2xl p-6 text-center shadow-md active:bg-emerald-600 disabled:opacity-50"
            >
              <span className="text-4xl">📷</span>
              <p className="text-xl font-semibold mt-2">拍照 / 选择图片</p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />

            {isProcessing && (
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-lg text-gray-600">正在识别中...</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-1">{Math.round(progress * 100)}%</p>
              </div>
            )}

            {imagePreview && !isProcessing && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <img src={imagePreview} alt="预览" className="w-full rounded-xl max-h-60 object-contain" />
              </div>
            )}
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-amber-800">请检查识别结果，删除错误内容，修正拼写</p>
            </div>

            {recognizedLines.map((line, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-6">{i + 1}</span>
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => updateLine(i, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    onClick={() => removeLine(i)}
                    className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center active:bg-red-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => setRecognizedLines(prev => [...prev, ''])}
              className="w-full border-2 border-dashed border-emerald-300 rounded-2xl p-3 text-emerald-500 active:bg-emerald-50"
            >
              + 手动添加单词
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('capture')}
                className="flex-1 bg-gray-200 text-gray-700 rounded-2xl p-4 text-lg font-semibold"
              >
                重新拍照
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-emerald-500 text-white rounded-2xl p-4 text-lg font-semibold active:bg-emerald-600"
              >
                确认录入 ({recognizedLines.filter(l => l.trim().length > 0).length} 个单词)
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
