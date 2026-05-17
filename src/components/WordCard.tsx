'use client';

import { useState } from 'react';
import Link from 'next/link';
import { speak } from '@/lib/tts';
import type { Word } from '@/lib/db';

interface WordCardProps {
  word: Word;
}

export default function WordCard({ word }: WordCardProps) {
  const stars = word.masteryLevel;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-2xl font-semibold text-gray-800">{word.text}</p>
          {word.phonetic && <p className="text-sm text-gray-500 mt-1">{word.phonetic}</p>}
          {word.translation && <p className="text-sm text-gray-400 mt-1">{word.translation}</p>}
          <div className="flex gap-1 mt-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`text-lg ${i < stars ? 'star-filled' : 'star-empty'}`}>
                {i < stars ? '★' : '☆'}
              </span>
            ))}
            <span className="text-xs text-gray-400 ml-2">复习 {word.reviewCount} 次</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={() => speak(word.text)}
            className="touch-target w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-lg active:bg-emerald-200 transition-colors"
            aria-label="听发音"
          >
            🔊
          </button>
          <Link
            href={`/words/${word.id}`}
            className="touch-target w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-lg active:bg-sky-200 transition-colors"
            aria-label="跟读练习"
          >
            🎤
          </Link>
        </div>
      </div>
    </div>
  );
}
