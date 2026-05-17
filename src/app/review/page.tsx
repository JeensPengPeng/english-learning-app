'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { getAllWords, updateWord, getSetting, setSetting, initAchievements } from '@/lib/db';
import { speak } from '@/lib/tts';
import { checkAndUnlockAchievements, checkSharpshooter } from '@/lib/achievements';

export default function ReviewPage() {
  const router = useRouter();
  const [words, setWords] = useState<{ id: string; text: string; masteryLevel: number }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ wordId: string; correct: boolean }[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAchievements();
    startReview();
  }, []);

  async function startReview() {
    const allWords = await getAllWords();
    // Priority: low mastery first
    const unmastered = allWords
      .filter(w => w.masteryLevel < 5)
      .sort((a, b) => a.masteryLevel - b.masteryLevel)
      .slice(0, 10)
      .map(w => ({ id: w.id, text: w.text, masteryLevel: w.masteryLevel }));

    if (unmastered.length === 0) {
      setSessionComplete(true);
      setIsLoading(false);
      return;
    }

    setWords(unmastered);
    setCurrentIndex(0);
    setResults([]);
    setIsLoading(false);
  }

  function handleAnswer(correct: boolean) {
    setResults(prev => [...prev, { wordId: words[currentIndex].id, correct }]);
    setShowAnswer(false);
    if (currentIndex + 1 >= words.length) {
      finishReview([...results, { wordId: words[currentIndex].id, correct }]);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  async function finishReview(finalResults: { wordId: string; correct: boolean }[]) {
    // Update mastery levels
    for (const r of finalResults) {
      const word = await import('@/lib/db').then(m => m.getWord(r.wordId));
      if (!word) continue;
      const newLevel = r.correct
        ? Math.min(5, word.masteryLevel + 1)
        : Math.max(0, word.masteryLevel - 1);
      await updateWord(r.wordId, {
        masteryLevel: newLevel,
        reviewCount: word.reviewCount + 1,
        lastReviewedAt: Date.now(),
      });
    }

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const lastReviewDate = await getSetting('last-review-date') as string | undefined;
    const currentStreak = (await getSetting('current-streak') as number | undefined) || 0;

    if (lastReviewDate === today) {
      // Already reviewed today
    } else if (lastReviewDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
      await setSetting('current-streak', currentStreak + 1);
    } else {
      await setSetting('current-streak', 1);
    }
    await setSetting('last-review-date', today);

    // Check achievements
    const correctCount = finalResults.filter(r => r.correct).length;
    const accuracy = Math.round((correctCount / finalResults.length) * 100);
    await checkSharpshooter(accuracy);
    await checkAndUnlockAchievements();

    setSessionComplete(true);
  }

  const currentWord = words[currentIndex];

  if (isLoading) {
    return <div className="flex flex-col min-h-screen pb-20"><div className="px-4 mt-12 text-center text-gray-400">准备复习中...</div></div>;
  }

  if (sessionComplete) {
    const correctCount = results.filter(r => r.correct).length;
    const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
    return (
      <div className="flex flex-col min-h-screen pb-20">
        <header className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-6 pt-12 pb-6 rounded-b-3xl">
          <h1 className="text-3xl font-bold">🎉 太棒了！</h1>
        </header>
        <div className="px-4 mt-8 text-center">
          <p className="text-6xl mb-4 celebrate">⭐</p>
          <p className="text-2xl font-bold text-gray-800">完成复习！</p>
          <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
            <p className="text-lg text-gray-600">答对 <span className="text-emerald-600 font-bold">{correctCount}</span> / {results.length}</p>
            <p className="text-4xl font-bold text-amber-500 mt-2">{accuracy}%</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-emerald-500 text-white rounded-2xl p-4 text-lg font-semibold mt-6 active:bg-emerald-600"
          >
            返回首页
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col min-h-screen pb-20">
        <header className="bg-gradient-to-r from-sky-500 to-blue-500 text-white px-6 pt-12 pb-4">
          <h1 className="text-2xl font-bold">📝 复习模式</h1>
        </header>
        <div className="px-4 mt-12 text-center">
          <p className="text-5xl mb-4">🌟</p>
          <p className="text-xl font-semibold text-gray-700">所有单词都已掌握！</p>
          <p className="text-gray-500 mt-2">录入更多单词来继续复习</p>
          <button onClick={() => router.push('/')} className="bg-emerald-500 text-white rounded-2xl px-8 py-4 text-lg font-semibold mt-6">
            返回首页
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-6 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-lg mb-2">← 结束</button>
        <h1 className="text-2xl font-bold">📝 复习</h1>
        <p className="text-amber-100 text-sm mt-1">第 {currentIndex + 1} / {words.length} 个</p>
      </header>

      {/* Progress bar */}
      <div className="px-4 mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-amber-400 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex) / words.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="px-4 mt-8 flex flex-col items-center">
        {/* Word display */}
        <div className="bg-white rounded-3xl p-8 shadow-md w-full max-w-sm text-center">
          <p className="text-4xl font-bold text-gray-800">{currentWord.text}</p>
        </div>

        {/* Listen button */}
        <button
          onClick={() => speak(currentWord.text)}
          className="mt-6 bg-emerald-500 text-white rounded-2xl px-8 py-4 text-xl font-semibold shadow-md active:bg-emerald-600"
        >
          🔊 听发音
        </button>

        {/* Answer buttons */}
        <div className="mt-8 w-full max-w-sm">
          <p className="text-center text-gray-500 mb-3">你认识这个单词吗？</p>
          <div className="flex gap-4">
            <button
              onClick={() => handleAnswer(false)}
              className="flex-1 bg-orange-400 text-white rounded-2xl p-4 text-xl font-semibold active:bg-orange-500"
            >
              🤔 再想想
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 bg-emerald-500 text-white rounded-2xl p-4 text-xl font-semibold active:bg-emerald-600"
            >
              😊 认识！
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
