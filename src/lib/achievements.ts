import { getAllWords, getAllAchievements, getAllLessons, getRecordingsByWord, unlockAchievement, getSetting } from '@/lib/db';

export async function checkAndUnlockAchievements(): Promise<string[]> {
  const unlocked: string[] = [];
  const achievements = await getAllAchievements();
  const unlockedList = achievements.filter(a => a.unlocked).map(a => a.condition);

  const words = await getAllWords();
  const lessons = await getAllLessons();

  // First recording
  if (!unlockedList.includes('first_recording')) {
    let hasRecording = false;
    for (const w of words) {
      const recs = await getRecordingsByWord(w.id);
      if (recs.length > 0) { hasRecording = true; break; }
    }
    if (hasRecording) {
      await unlockAchievement('first-recording');
      unlocked.push('first-recording');
    }
  }

  // 100 recordings
  if (!unlockedList.includes('record_100')) {
    let total = 0;
    for (const w of words) {
      const recs = await getRecordingsByWord(w.id);
      total += recs.length;
    }
    if (total >= 100) {
      await unlockAchievement('record-100');
      unlocked.push('record-100');
    }
  }

  // Vocabulary master (50 words at masteryLevel 5)
  if (!unlockedList.includes('vocab_master')) {
    const mastered = words.filter(w => w.masteryLevel >= 5).length;
    if (mastered >= 50) {
      await unlockAchievement('vocab-master');
      unlocked.push('vocab-master');
    }
  }

  return unlocked;
}

export async function checkStreakAchievements(): Promise<string[]> {
  const unlocked: string[] = [];
  const achievements = await getAllAchievements();
  const unlockedList = achievements.filter(a => a.unlocked).map(a => a.condition);

  // Calculate streak from review dates
  const streak = await (getSetting('current-streak') as Promise<number | undefined>);
  const currentStreak = streak || 0;

  if (currentStreak >= 7 && !unlockedList.includes('streak_7')) {
    await unlockAchievement('streak-7');
    unlocked.push('streak-7');
  } else if (currentStreak >= 3 && !unlockedList.includes('streak_3')) {
    await unlockAchievement('streak-3');
    unlocked.push('streak-3');
  }

  return unlocked;
}

export async function checkSharpshooter(accuracy: number): Promise<string[]> {
  const unlocked: string[] = [];
  const achievements = await getAllAchievements();
  if (!achievements.find(a => a.id === 'sharpshooter')?.unlocked && accuracy >= 90) {
    await unlockAchievement('sharpshooter');
    unlocked.push('sharpshooter');
  }
  return unlocked;
}
