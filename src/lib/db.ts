import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface Word {
  id: string;
  text: string;
  translation?: string;
  phonetic?: string;
  sourceLesson: string;
  createdAt: number;
  lastReviewedAt?: number;
  reviewCount: number;
  masteryLevel: number;
}

export interface Recording {
  id: string;
  wordId: string;
  type: 'standard' | 'practice';
  audioData: Blob;
  createdAt: number;
  waveformData?: number[];
}

export interface Lesson {
  id: string;
  title: string;
  date: string;
  wordIds: string[];
  createdAt: number;
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  condition: string;
}

interface AppDB extends DBSchema {
  words: {
    key: string;
    value: Word;
    indexes: {
      sourceLesson: string;
      masteryLevel: number;
      lastReviewedAt: number;
    };
  };
  recordings: {
    key: string;
    value: Recording;
    indexes: {
      wordId: string;
      createdAt: number;
    };
  };
  lessons: {
    key: string;
    value: Lesson;
    indexes: {
      date: string;
      createdAt: number;
    };
  };
  achievements: {
    key: string;
    value: Achievement;
  };
  settings: {
    key: string;
    value: { key: string; value: string | number | boolean };
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>('english-review-db', 1, {
      upgrade(db) {
        // Words store
        const wordStore = db.createObjectStore('words', { keyPath: 'id' });
        wordStore.createIndex('sourceLesson', 'sourceLesson');
        wordStore.createIndex('masteryLevel', 'masteryLevel');
        wordStore.createIndex('lastReviewedAt', 'lastReviewedAt');

        // Recordings store
        const recStore = db.createObjectStore('recordings', { keyPath: 'id' });
        recStore.createIndex('wordId', 'wordId');
        recStore.createIndex('createdAt', 'createdAt');

        // Lessons store
        const lessonStore = db.createObjectStore('lessons', { keyPath: 'id' });
        lessonStore.createIndex('date', 'date');
        lessonStore.createIndex('createdAt', 'createdAt');

        // Achievements store
        db.createObjectStore('achievements', { keyPath: 'id' });

        // Settings store
        db.createObjectStore('settings', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

// Word CRUD
export async function addWord(word: Word): Promise<void> {
  const db = await getDB();
  await db.put('words', word);
}

export async function updateWord(id: string, updates: Partial<Word>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('words', id);
  if (existing) {
    await db.put('words', { ...existing, ...updates });
  }
}

export async function deleteWord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('words', id);
  // Also delete associated recordings
  const recordings = await db.getAllFromIndex('recordings', 'wordId', id);
  for (const rec of recordings) {
    await db.delete('recordings', rec.id);
  }
}

export async function getWord(id: string): Promise<Word | undefined> {
  const db = await getDB();
  return db.get('words', id);
}

export async function getAllWords(): Promise<Word[]> {
  const db = await getDB();
  return db.getAll('words');
}

export async function getWordsByLesson(lessonId: string): Promise<Word[]> {
  const db = await getDB();
  return db.getAllFromIndex('words', 'sourceLesson', lessonId);
}

// Recording CRUD
export async function addRecording(recording: Recording): Promise<void> {
  const db = await getDB();
  await db.put('recordings', recording);
}

export async function getRecordingsByWord(wordId: string): Promise<Recording[]> {
  const db = await getDB();
  return db.getAllFromIndex('recordings', 'wordId', wordId);
}

export async function deleteRecording(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('recordings', id);
}

// Lesson CRUD
export async function addLesson(lesson: Lesson): Promise<void> {
  const db = await getDB();
  await db.put('lessons', lesson);
}

export async function getAllLessons(): Promise<Lesson[]> {
  const db = await getDB();
  return db.getAll('lessons');
}

export async function getLesson(id: string): Promise<Lesson | undefined> {
  const db = await getDB();
  return db.get('lessons', id);
}

export async function deleteLesson(id: string): Promise<void> {
  const db = await getDB();
  const lesson = await db.get('lessons', id);
  if (lesson) {
    // Delete associated words
    for (const wordId of lesson.wordIds) {
      await deleteWord(wordId);
    }
  }
  await db.delete('lessons', id);
}

// Settings
export async function getSetting(key: string): Promise<string | number | boolean | undefined> {
  const db = await getDB();
  const s = await db.get('settings', key);
  return s?.value;
}

export async function setSetting(key: string, value: string | number | boolean): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

// Achievements
export async function initAchievements(): Promise<void> {
  const db = await getDB();
  const existing = await db.getAll('achievements');
  if (existing.length > 0) return;

  const defaultAchievements: Achievement[] = [
    { id: 'first-recording', name: '首次录音', icon: '🎤', description: '完成第一次跟读', unlocked: false, condition: 'first_recording' },
    { id: 'streak-3', name: '连续学习3天', icon: '🔥', description: '连续3天有复习记录', unlocked: false, condition: 'streak_3' },
    { id: 'streak-7', name: '连续学习7天', icon: '🔥🔥', description: '连续7天有复习记录', unlocked: false, condition: 'streak_7' },
    { id: 'vocab-master', name: '词汇大师', icon: '📚', description: '掌握50个单词', unlocked: false, condition: 'vocab_master' },
    { id: 'sharpshooter', name: '神射手', icon: '🎯', description: '单次复习正确率 ≥ 90%', unlocked: false, condition: 'sharpshooter' },
    { id: 'record-100', name: '录音100次', icon: '🎵', description: '累计录音100条', unlocked: false, condition: 'record_100' },
  ];

  for (const a of defaultAchievements) {
    await db.put('achievements', a);
  }
}

export async function getAllAchievements(): Promise<Achievement[]> {
  const db = await getDB();
  return db.getAll('achievements');
}

export async function unlockAchievement(id: string): Promise<void> {
  const db = await getDB();
  const a = await db.get('achievements', id);
  if (a && !a.unlocked) {
    a.unlocked = true;
    a.unlockedAt = Date.now();
    await db.put('achievements', a);
  }
}

// Storage estimate
export async function getStorageEst(): Promise<{ usage: number; quota: number }> {
  const est = await navigator.storage.estimate();
  return { usage: est.usage || 0, quota: est.quota || 0 };
}

// Cleanup old recordings
export async function cleanupOldRecordings(daysAgo: number): Promise<number> {
  const db = await getDB();
  const cutoff = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
  const toDelete = await db.getAllFromIndex('recordings', 'createdAt');
  let count = 0;
  for (const rec of toDelete) {
    if (rec.createdAt < cutoff) {
      await db.delete('recordings', rec.id);
      count++;
    }
  }
  return count;
}

// Max recordings per word
export const MAX_RECORDINGS_PER_WORD = 3;
