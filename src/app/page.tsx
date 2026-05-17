'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import WordCard from '@/components/WordCard';
import { getAllWords, getAllLessons } from '@/lib/db';
import type { Word } from '@/lib/db';
import { preloadVoices } from '@/lib/tts';

export default function Home() {
  const [recentWords, setRecentWords] = useState<Word[]>([]);
  const [lessonCount, setLessonCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    preloadVoices();
    loadData();
  }, []);

  async function loadData() {
    const words = await getAllWords();
    const lessons = await getAllLessons();
    setRecentWords(words.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5));
    setLessonCount(lessons.length);
    setReviewCount(words.filter(w => w.reviewCount > 0).length);
    setMasteredCount(words.filter(w => w.masteryLevel >= 5).length);
    setIsLoading(false);
  }

  const reviewWords = recentWords.filter(w => w.masteryLevel < 5);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-3xl font-bold">课后英语复习</h1>
        <p className="text-emerald-100 mt-1">每天进步一点点</p>
      </header>

      {/* Stats */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{lessonCount}</p>
            <p className="text-xs text-gray-500">课程</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-sky-600">{reviewCount}</p>
            <p className="text-xs text-gray-500">已复习</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{masteredCount}</p>
            <p className="text-xs text-gray-500">已掌握</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <Link
          href="/lessons/new"
          className="block bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-5 text-center shadow-md active:scale-95 transition-transform"
        >
          <span className="text-3xl">📷</span>
          <p className="text-lg font-semibold mt-2">录入新单词</p>
          <p className="text-emerald-100 text-sm">拍照识别课本内容</p>
        </Link>

        {reviewWords.length > 0 && (
          <Link
            href="/review"
            className="block bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl p-5 text-center shadow-md mt-4 active:scale-95 transition-transform"
          >
            <span className="text-3xl">📝</span>
            <p className="text-lg font-semibold mt-2">开始复习</p>
            <p className="text-amber-100 text-sm">{reviewWords.length} 个单词待复习</p>
          </Link>
        )}
      </div>

      {/* Recent Words */}
      {!isLoading && recentWords.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">最近学习</h2>
          <div className="flex flex-col gap-3">
            {recentWords.map((word) => (
              <WordCard key={word.id} word={word} />
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="px-4 mt-8 text-center text-gray-400">
          <p>加载中...</p>
        </div>
      )}

      {!isLoading && recentWords.length === 0 && (
        <div className="px-4 mt-12 text-center">
          <p className="text-5xl mb-4">📚</p>
          <p className="text-gray-500">还没有录入单词</p>
          <p className="text-gray-400 text-sm mt-1">点击上方按钮开始录入</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
