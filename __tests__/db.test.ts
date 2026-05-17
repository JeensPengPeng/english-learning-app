import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getDB,
  addWord,
  getWord,
  updateWord,
  deleteWord,
  getAllWords,
  addLesson,
  getLesson,
  getAllLessons,
  deleteLesson,
  getWordsByLesson,
  addRecording,
  getRecordingsByWord,
  deleteRecording,
  getSetting,
  setSetting,
  type Word,
  type Lesson,
  type Recording,
} from '@/lib/db';

describe('IndexedDB Data Layer', () => {
  beforeEach(async () => {
    const db = await getDB();
    await db.clear('words');
    await db.clear('lessons');
    await db.clear('recordings');
    await db.clear('settings');
  });

  describe('Words', () => {
    const sampleWord: Word = {
      id: 'word-1',
      text: 'apple',
      sourceLesson: 'lesson-1',
      createdAt: Date.now(),
      reviewCount: 0,
      masteryLevel: 0,
    };

    it('should add and retrieve a word', async () => {
      await addWord(sampleWord);
      const word = await getWord('word-1');
      expect(word).toBeDefined();
      expect(word?.text).toBe('apple');
    });

    it('should update a word', async () => {
      await addWord(sampleWord);
      await updateWord('word-1', { masteryLevel: 3, reviewCount: 5 });
      const word = await getWord('word-1');
      expect(word?.masteryLevel).toBe(3);
      expect(word?.reviewCount).toBe(5);
    });

    it('should delete a word', async () => {
      await addWord(sampleWord);
      await deleteWord('word-1');
      const word = await getWord('word-1');
      expect(word).toBeUndefined();
    });

    it('should get all words', async () => {
      await addWord(sampleWord);
      await addWord({ ...sampleWord, id: 'word-2', text: 'banana' });
      const words = await getAllWords();
      expect(words).toHaveLength(2);
    });

    it('should get words by lesson', async () => {
      await addWord(sampleWord);
      await addWord({ ...sampleWord, id: 'word-2', text: 'banana', sourceLesson: 'lesson-1' });
      await addWord({ ...sampleWord, id: 'word-3', text: 'cherry', sourceLesson: 'lesson-2' });
      const words = await getWordsByLesson('lesson-1');
      expect(words).toHaveLength(2);
      expect(words.every(w => w.sourceLesson === 'lesson-1')).toBe(true);
    });
  });

  describe('Lessons', () => {
    const sampleLesson: Lesson = {
      id: 'lesson-1',
      title: 'Unit 1 - Animals',
      date: '2024-12-15',
      wordIds: ['word-1', 'word-2'],
      createdAt: Date.now(),
    };

    it('should add and retrieve a lesson', async () => {
      await addLesson(sampleLesson);
      const lesson = await getLesson('lesson-1');
      expect(lesson).toBeDefined();
      expect(lesson?.title).toBe('Unit 1 - Animals');
    });

    it('should get all lessons', async () => {
      await addLesson(sampleLesson);
      await addLesson({ ...sampleLesson, id: 'lesson-2', title: 'Unit 2 - Colors' });
      const lessons = await getAllLessons();
      expect(lessons).toHaveLength(2);
    });

    it('should delete a lesson and its words', async () => {
      const word: Word = {
        id: 'word-1',
        text: 'dog',
        sourceLesson: 'lesson-1',
        createdAt: Date.now(),
        reviewCount: 0,
        masteryLevel: 0,
      };
      await addWord(word);
      await addLesson(sampleLesson);
      await deleteLesson('lesson-1');
      const lesson = await getLesson('lesson-1');
      expect(lesson).toBeUndefined();
      const w = await getWord('word-1');
      expect(w).toBeUndefined();
    });
  });

  describe('Recordings', () => {
    const sampleBlob = new Blob(['audio data'], { type: 'audio/webm' });

    const sampleRecording: Recording = {
      id: 'rec-1',
      wordId: 'word-1',
      type: 'practice',
      audioData: sampleBlob,
      createdAt: Date.now(),
    };

    it('should add and retrieve recordings by word', async () => {
      await addRecording(sampleRecording);
      const recs = await getRecordingsByWord('word-1');
      expect(recs).toHaveLength(1);
      expect(recs[0]?.wordId).toBe('word-1');
    });

    it('should delete a recording', async () => {
      await addRecording(sampleRecording);
      await deleteRecording('rec-1');
      const recs = await getRecordingsByWord('word-1');
      expect(recs).toHaveLength(0);
    });
  });

  describe('Settings', () => {
    it('should store and retrieve settings', async () => {
      await setSetting('max-recordings', 5);
      const val = await getSetting('max-recordings');
      expect(val).toBe(5);
    });

    it('should store string settings', async () => {
      await setSetting('theme', 'dark');
      const val = await getSetting('theme');
      expect(val).toBe('dark');
    });

    it('should return undefined for missing settings', async () => {
      const val = await getSetting('nonexistent');
      expect(val).toBeUndefined();
    });
  });
});
