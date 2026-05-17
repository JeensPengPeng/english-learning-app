'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { getAllLessons, deleteLesson, getWordsByLesson } from '@/lib/db';
import type { Lesson } from '@/lib/db';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<(Lesson & { wordCount: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const allLessons = await getAllLessons();
    const lessonsWithCount = await Promise.all(
      allLessons.map(async (lesson) => {
        const words = await getWordsByLesson(lesson.id);
        return { ...lesson, wordCount: words.length };
      })
    );
    lessonsWithCount.sort((a, b) => b.createdAt - a.createdAt);
    setLessons(lessonsWithCount);
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (confirm('确定删除这个课程吗？相关的单词和录音也会被删除。')) {
      await deleteLesson(id);
      loadData();
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 pt-12 pb-4">
        <h1 className="text-3xl font-bold">📚 我的词库</h1>
      </header>

      <div className="px-4 mt-4">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 mb-3">
            <Link href={`/lessons/${lesson.id}`} className="block">
              <p className="text-xl font-semibold text-gray-800">{lesson.title}</p>
              <p className="text-sm text-gray-500 mt-1">{lesson.date} · {lesson.wordCount} 个单词</p>
            </Link>
            <button
              onClick={(e) => { e.preventDefault(); handleDelete(lesson.id); }}
              className="mt-2 text-sm text-red-400 active:text-red-600"
            >
              删除
            </button>
          </div>
        ))}

        {isLoading && <p className="text-center text-gray-400 mt-8">加载中...</p>}

        {!isLoading && lessons.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-5xl mb-4">📖</p>
            <p className="text-gray-500">还没有课程</p>
          </div>
        )}

        <Link
          href="/lessons/new"
          className="block bg-emerald-500 text-white rounded-2xl p-4 text-center shadow-md mt-4 active:bg-emerald-600 transition-colors"
        >
          <span className="text-2xl">+</span>
          <p className="text-lg font-semibold mt-1">录入新课</p>
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
