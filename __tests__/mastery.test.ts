import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Review Mastery Logic', () => {
  it('should increase mastery on correct answer (max 5)', () => {
    const mastery = 3;
    const result = true;
    const newLevel = result ? Math.min(5, mastery + 1) : Math.max(0, mastery - 1);
    expect(newLevel).toBe(4);
  });

  it('should cap mastery at 5', () => {
    const mastery = 5;
    const result = true;
    const newLevel = result ? Math.min(5, mastery + 1) : Math.max(0, mastery - 1);
    expect(newLevel).toBe(5);
  });

  it('should decrease mastery on incorrect answer (min 0)', () => {
    const mastery = 2;
    const result = false;
    const newLevel = result ? Math.min(5, mastery + 1) : Math.max(0, mastery - 1);
    expect(newLevel).toBe(1);
  });

  it('should not go below 0', () => {
    const mastery = 0;
    const result = false;
    const newLevel = result ? Math.min(5, mastery + 1) : Math.max(0, mastery - 1);
    expect(newLevel).toBe(0);
  });

  it('should mark mastery 5 as mastered', () => {
    const words = [
      { id: '1', text: 'cat', masteryLevel: 5 },
      { id: '2', text: 'dog', masteryLevel: 3 },
      { id: '3', text: 'bird', masteryLevel: 0 },
    ];
    const mastered = words.filter(w => w.masteryLevel >= 5);
    expect(mastered).toHaveLength(1);
    expect(mastered[0]?.text).toBe('cat');
  });

  it('should prioritize low mastery words for review', () => {
    const words = [
      { id: '1', text: 'cat', masteryLevel: 5 },
      { id: '2', text: 'dog', masteryLevel: 0 },
      { id: '3', text: 'bird', masteryLevel: 1 },
      { id: '4', text: 'fish', masteryLevel: 3 },
    ];
    const reviewWords = words
      .filter(w => w.masteryLevel < 5)
      .sort((a, b) => a.masteryLevel - b.masteryLevel)
      .slice(0, 10);

    expect(reviewWords[0]?.masteryLevel).toBe(0);
    expect(reviewWords[1]?.masteryLevel).toBe(1);
    expect(reviewWords[2]?.masteryLevel).toBe(3);
  });

  it('should calculate accuracy correctly', () => {
    const results = [
      { wordId: '1', correct: true },
      { wordId: '2', correct: true },
      { wordId: '3', correct: false },
      { wordId: '4', correct: true },
    ];
    const correctCount = results.filter(r => r.correct).length;
    const accuracy = Math.round((correctCount / results.length) * 100);
    expect(accuracy).toBe(75);
  });

  it('should identify sharpshooter achievement (>=90%)', () => {
    const results = [
      { wordId: '1', correct: true },
      { wordId: '2', correct: true },
      { wordId: '3', correct: true },
      { wordId: '4', correct: true },
      { wordId: '5', correct: false },
    ];
    const correctCount = results.filter(r => r.correct).length;
    const accuracy = Math.round((correctCount / results.length) * 100);
    expect(accuracy).toBe(80);
    expect(accuracy >= 90).toBe(false);
  });
});
