'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { getStorageEst, cleanupOldRecordings, getSetting, setSetting, getDB } from '@/lib/db';

export default function SettingsPage() {
  const [storageUsage, setStorageUsage] = useState(0);
  const [storageQuota, setStorageQuota] = useState(0);
  const [maxRecordings, setMaxRecordings] = useState(3);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanedCount, setCleanedCount] = useState(0);

  useEffect(() => {
    loadStorageInfo();
    loadSettings();
  }, []);

  async function loadStorageInfo() {
    const est = await getStorageEst();
    setStorageUsage(est.usage);
    setStorageQuota(est.quota);
  }

  async function loadSettings() {
    const val = await getSetting('max-recordings');
    if (val) setMaxRecordings(val as number);
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  const usagePercent = storageQuota > 0 ? (storageUsage / storageQuota) * 100 : 0;

  async function handleCleanup30Days() {
    setIsCleaning(true);
    const count = await cleanupOldRecordings(30);
    setCleanedCount(count);
    setIsCleaning(false);
    loadStorageInfo();
    setTimeout(() => setCleanedCount(0), 3000);
  }

  async function handleCleanupOld() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      const db = await getDB();
      await db.clear('words');
      await db.clear('recordings');
      await db.clear('lessons');
      await db.clear('achievements');
      loadStorageInfo();
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 pt-12 pb-4">
        <h1 className="text-3xl font-bold">⚙️ 设置</h1>
      </header>

      <div className="px-4 mt-4 space-y-4">
        {/* Storage info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800">📊 已用存储</h3>
          <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
            <div
              className={`h-3 rounded-full transition-all ${usagePercent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, usagePercent)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formatBytes(storageUsage)} / {formatBytes(storageQuota)}
          </p>
          {usagePercent > 80 && (
            <p className="text-sm text-red-500 mt-2">⚠️ 存储空间即将用完，建议清理旧录音</p>
          )}
        </div>

        {/* Cleanup 30 days */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800">🗑️ 清理 30 天前录音</h3>
          <button
            onClick={handleCleanup30Days}
            disabled={isCleaning}
            className="mt-3 w-full bg-orange-400 text-white rounded-xl p-3 text-lg font-semibold active:bg-orange-500 disabled:opacity-50"
          >
            {isCleaning ? '清理中...' : '立即清理'}
          </button>
          {cleanedCount > 0 && (
            <p className="text-sm text-emerald-500 mt-2 text-center">已清理 {cleanedCount} 条录音</p>
          )}
        </div>

        {/* Max recordings per word */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800">🔄 录音保留策略</h3>
          <p className="text-sm text-gray-500 mt-1">每个单词保留最新录音数</p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => { setMaxRecordings(Math.max(1, maxRecordings - 1)); setSetting('max-recordings', Math.max(1, maxRecordings - 1)); }}
              className="w-10 h-10 rounded-full bg-gray-200 text-xl font-bold active:bg-gray-300"
            >
              -
            </button>
            <span className="text-2xl font-bold w-8 text-center">{maxRecordings}</span>
            <button
              onClick={() => { setMaxRecordings(Math.min(10, maxRecordings + 1)); setSetting('max-recordings', Math.min(10, maxRecordings + 1)); }}
              className="w-10 h-10 rounded-full bg-gray-200 text-xl font-bold active:bg-gray-300"
            >
              +
            </button>
            <span className="text-sm text-gray-400">条</span>
          </div>
        </div>

        {/* Reset all */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-200">
          <h3 className="font-semibold text-red-600">🗑️ 清除所有数据</h3>
          <p className="text-sm text-gray-500 mt-1">⚠️ 此操作不可恢复</p>
          <button
            onClick={handleCleanupOld}
            className="mt-3 w-full bg-red-500 text-white rounded-xl p-3 text-lg font-semibold active:bg-red-600"
          >
            重置
          </button>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800">关于</h3>
          <p className="text-sm text-gray-500 mt-2">课后英语复习 v1.0</p>
          <p className="text-xs text-gray-400 mt-1">所有数据存储在浏览器本地</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
