'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import WordCard from '@/components/WordCard';
import { getLesson, getWordsByLesson } from '@/lib/db';
import type { Lesson, Word } from '@/lib/db';

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const l = await getLesson(id);
    if (!l) {
      router.push('/lessons');
      return;
    }
    setLesson(l);
    const w = await getWordsByLesson(id);
    setWords(w);
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen pb-20">
        <div className="px-4 mt-12 text-center text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-lg mb-2">← 返回</button>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <p className="text-emerald-100 text-sm mt-1">{lesson.date} · {words.length} 个单词</p>
      </header>

      <div className="px-4 mt-4 flex flex-col gap-3">
        {words.map((word) => (
          <WordCard key={word.id} word={word} />
        ))}

        {words.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-5xl mb-4">📝</p>
            <p className="text-gray-500">这个课程还没有单词</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
