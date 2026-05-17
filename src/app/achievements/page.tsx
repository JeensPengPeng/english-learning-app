'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { getAllAchievements, initAchievements } from '@/lib/db';
import type { Achievement } from '@/lib/db';
import { checkAndUnlockAchievements, checkStreakAchievements } from '@/lib/achievements';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await initAchievements();
    const unlocked = await checkAndUnlockAchievements();
    const streakUnlocked = await checkStreakAchievements();
    setNewlyUnlocked([...unlocked, ...streakUnlocked]);

    const all = await getAllAchievements();
    setAchievements(all);
    setIsLoading(false);

    // Clear notification after delay
    setTimeout(() => setNewlyUnlocked([]), 3000);
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 pt-12 pb-4">
        <h1 className="text-3xl font-bold">🌟 我的成就</h1>
      </header>

      {/* Newly unlocked notification */}
      {newlyUnlocked.length > 0 && (
        <div className="px-4 mt-4">
          <div className="bg-amber-100 border border-amber-300 rounded-2xl p-4 text-center celebrate">
            <p className="text-amber-800 font-semibold">🎉 新成就解锁！</p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">总进度</p>
          <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">{unlockedCount} / {totalCount}</p>
        </div>
      </div>

      {/* Achievement grid */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl p-4 text-center shadow-sm ${
                a.unlocked
                  ? 'bg-white border border-emerald-200'
                  : 'bg-gray-100 opacity-60'
              }`}
            >
              <span className={`text-3xl ${a.unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
              <p className="text-sm font-semibold mt-2 text-gray-800">{a.name}</p>
              <p className="text-xs text-gray-500 mt-1">{a.description}</p>
              {a.unlocked && a.unlockedAt && (
                <p className="text-xs text-emerald-500 mt-1">
                  {new Date(a.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-center text-gray-400 mt-8">加载中...</p>}

      <BottomNav />
    </div>
  );
}
