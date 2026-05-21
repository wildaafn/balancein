/**
 * BalanceIn — Data Storage Layer
 * Handles localStorage for settings & daily data,
 * with helper functions for tracking state.
 */

const Storage = (() => {
  const KEYS = {
    SETTINGS: 'balancein_settings',
    DAILY_DATA: 'balancein_daily_',
    HISTORY: 'balancein_history',
    STREAK: 'balancein_streak',
    CHAT_HISTORY: 'balancein_chat',
    ONBOARDED: 'balancein_onboarded',
    ACHIEVEMENTS: 'balancein_achievements',
    GRATITUDE: 'balancein_gratitude',
  };

  // --- Helpers ---
  function getTodayKey() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }

  function load(key, fallback = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error('Storage load error:', e);
      return fallback;
    }
  }

  // --- Settings ---
  const defaultSettings = {
    userName: '', // User's name for personalization
    waterTarget: 8,
    exerciseTarget: 30, // minutes
    sleepTarget: 7, // hours
    location: { latitude: -6.2088, longitude: 106.8456, city: 'Jakarta' },
    prayerMethod: 11, // Kemenag RI
    notificationsEnabled: false,
    prayerReminder: true,
    waterReminder: true,
    exerciseReminder: true,
  };

  function getSettings() {
    return load(KEYS.SETTINGS, { ...defaultSettings });
  }

  function saveSettings(settings) {
    save(KEYS.SETTINGS, { ...defaultSettings, ...settings });
  }

  function updateSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    saveSettings(settings);
  }

  // --- Daily Data ---
  function getDefaultDailyData() {
    return {
      date: getTodayKey(),
      water: 0,
      exercise: { done: false, minutes: 0, type: '' },
      sleep: { bedtime: '', wakeup: '', hours: 0 },
      meals: { breakfast: false, lunch: false, dinner: false },
      prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
      dzikir: { count: 0, target: 33 },
      quran: false,
      mentalCheckin: { mood: 0, notes: '' },
      fasting: { active: false, type: '' },
      gratitude: [],
      breathing: { sessions: 0 },
    };
  }

  function getDailyData() {
    const key = KEYS.DAILY_DATA + getTodayKey();
    return load(key, getDefaultDailyData());
  }

  function saveDailyData(data) {
    const key = KEYS.DAILY_DATA + getTodayKey();
    data.date = getTodayKey();
    save(key, data);
    updateStreak(data);
  }

  function updateDailyField(field, value) {
    const data = getDailyData();
    const parts = field.split('.');
    if (parts.length === 2) {
      if (!data[parts[0]]) data[parts[0]] = {};
      data[parts[0]][parts[1]] = value;
    } else {
      data[field] = value;
    }
    saveDailyData(data);
    return data;
  }

  // --- Calculations ---
  function calculateHealthScore(data) {
    const settings = getSettings();
    let score = 0;
    let total = 0;

    // Water (30%)
    total += 30;
    score += Math.min(30, (data.water / settings.waterTarget) * 30);

    // Exercise (25%)
    total += 25;
    if (data.exercise.done) score += 25;
    else score += Math.min(25, (data.exercise.minutes / settings.exerciseTarget) * 25);

    // Sleep (25%)
    total += 25;
    if (data.sleep.hours > 0) {
      const sleepRatio = Math.min(data.sleep.hours / settings.sleepTarget, 1);
      score += sleepRatio * 25;
    }

    // Meals (20%)
    total += 20;
    const mealCount = [data.meals.breakfast, data.meals.lunch, data.meals.dinner].filter(Boolean).length;
    score += (mealCount / 3) * 20;

    return Math.round((score / total) * 100);
  }

  function calculateSpiritualScore(data) {
    let score = 0;
    let total = 0;

    // Prayers (60%)
    total += 60;
    const prayerCount = Object.values(data.prayers).filter(Boolean).length;
    score += (prayerCount / 5) * 60;

    // Dzikir (20%)
    total += 20;
    score += Math.min(20, (data.dzikir.count / data.dzikir.target) * 20);

    // Quran (20%)
    total += 20;
    if (data.quran) score += 20;

    return Math.round((score / total) * 100);
  }

  function calculateMentalScore(data) {
    // Mental score is based on:
    // - Did a mood check-in (40%)
    // - Sleep quality (30%)
    // - Exercise (stress relief) (30%)
    let score = 0;

    if (data.mentalCheckin.mood > 0) {
      score += (data.mentalCheckin.mood / 5) * 40;
    } else {
      score += 20; // Neutral default
    }

    const settings = getSettings();
    if (data.sleep.hours >= settings.sleepTarget) {
      score += 30;
    } else if (data.sleep.hours > 0) {
      score += (data.sleep.hours / settings.sleepTarget) * 30;
    } else {
      score += 15; // Default
    }

    if (data.exercise.done || data.exercise.minutes >= settings.exerciseTarget) {
      score += 30;
    } else if (data.exercise.minutes > 0) {
      score += (data.exercise.minutes / settings.exerciseTarget) * 30;
    } else {
      score += 10; // Default
    }

    return Math.round(Math.min(100, score));
  }

  function calculateBalanceScore(data) {
    const health = calculateHealthScore(data);
    const spiritual = calculateSpiritualScore(data);
    const mental = calculateMentalScore(data);
    return Math.round((health + spiritual + mental) / 3);
  }

  // --- Streak ---
  function updateStreak(data) {
    const streak = load(KEYS.STREAK, { current: 0, best: 0, lastDate: '' });
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const prayersDone = Object.values(data.prayers).filter(Boolean).length;

    if (prayersDone >= 3 && data.water >= 4) {
      if (streak.lastDate === yesterday || streak.lastDate === '') {
        streak.current = streak.lastDate === yesterday ? streak.current + 1 : 1;
      } else if (streak.lastDate !== today) {
        streak.current = 1;
      }
      streak.lastDate = today;
      streak.best = Math.max(streak.best, streak.current);
    }

    save(KEYS.STREAK, streak);
    return streak;
  }

  function getStreak() {
    return load(KEYS.STREAK, { current: 0, best: 0, lastDate: '' });
  }

  // --- Chat History ---
  function getChatHistory() {
    return load(KEYS.CHAT_HISTORY, []);
  }

  function saveChatMessage(role, content) {
    const history = getChatHistory();
    history.push({ role, content, timestamp: Date.now() });
    // Keep last 50 messages
    if (history.length > 50) history.splice(0, history.length - 50);
    save(KEYS.CHAT_HISTORY, history);
  }

  function clearChatHistory() {
    save(KEYS.CHAT_HISTORY, []);
  }

  // --- History (for charts) ---
  function getWeeklyHistory() {
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const data = load(KEYS.DAILY_DATA + date, null);
      history.push({
        date,
        day: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][new Date(date).getDay()],
        health: data ? calculateHealthScore(data) : 0,
        spiritual: data ? calculateSpiritualScore(data) : 0,
        mental: data ? calculateMentalScore(data) : 0,
        balance: data ? calculateBalanceScore(data) : 0,
      });
    }
    return history;
  }

  // --- Reset ---
  function resetAllData() {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('balancein_'));
    keys.forEach((k) => localStorage.removeItem(k));
  }

  // --- Achievements ---
  const ACHIEVEMENT_DEFS = [
    { id: 'first_water', name: 'Tetes Pertama', icon: '💧', desc: 'Catat minum air pertama kali', category: 'health' },
    { id: 'hydration_master', name: 'Hydration Master', icon: '🌊', desc: 'Capai target air 7 hari berturut-turut', category: 'health' },
    { id: 'early_bird', name: 'Early Bird', icon: '🌅', desc: 'Catat sholat Subuh 7 hari berturut-turut', category: 'spiritual' },
    { id: 'prayer_warrior', name: 'Prayer Warrior', icon: '🕌', desc: 'Sholat 5 waktu lengkap dalam sehari', category: 'spiritual' },
    { id: 'dzikir_33', name: 'Tasbih Starter', icon: '📿', desc: 'Selesaikan 33x dzikir', category: 'spiritual' },
    { id: 'dzikir_99', name: 'Tasbih Master', icon: '✨', desc: 'Selesaikan 99x dzikir', category: 'spiritual' },
    { id: 'first_exercise', name: 'Langkah Pertama', icon: '🏃', desc: 'Catat olahraga pertama kali', category: 'health' },
    { id: 'exercise_week', name: 'Fitness Warrior', icon: '💪', desc: 'Olahraga 7 hari berturut-turut', category: 'health' },
    { id: 'balance_70', name: 'Finding Balance', icon: '⚖️', desc: 'Raih Balance Score 70%+', category: 'general' },
    { id: 'balance_90', name: 'Balance Master', icon: '🏆', desc: 'Raih Balance Score 90%+', category: 'general' },
    { id: 'streak_3', name: 'Konsisten', icon: '🔥', desc: 'Streak 3 hari berturut-turut', category: 'general' },
    { id: 'streak_7', name: 'Istiqomah', icon: '⭐', desc: 'Streak 7 hari berturut-turut', category: 'general' },
    { id: 'streak_30', name: 'Legendaris', icon: '👑', desc: 'Streak 30 hari berturut-turut', category: 'general' },
    { id: 'first_breathing', name: 'Inner Peace', icon: '🧘', desc: 'Selesaikan sesi breathing pertama', category: 'mental' },
    { id: 'gratitude_writer', name: 'Bersyukur', icon: '📝', desc: 'Tulis 3 hal syukur dalam sehari', category: 'mental' },
    { id: 'fasting_first', name: 'Puasa Pertama', icon: '🌙', desc: 'Catat puasa sunnah pertama', category: 'spiritual' },
    { id: 'quran_reader', name: 'Pecinta Quran', icon: '📖', desc: 'Tilawah 7 hari berturut-turut', category: 'spiritual' },
    { id: 'ai_chatter', name: 'Curious Mind', icon: '🤖', desc: 'Chat dengan AI Coach 10 kali', category: 'mental' },
  ];

  function getAchievements() {
    return load(KEYS.ACHIEVEMENTS, []);
  }

  function unlockAchievement(id) {
    const achievements = getAchievements();
    if (achievements.includes(id)) return false;
    achievements.push(id);
    save(KEYS.ACHIEVEMENTS, achievements);
    return true;
  }

  function checkAchievements() {
    const data = getDailyData();
    const streak = getStreak();
    const balance = calculateBalanceScore(data);
    const chatHistory = getChatHistory();
    const newlyUnlocked = [];

    if (data.water > 0 && unlockAchievement('first_water')) newlyUnlocked.push('first_water');
    if (data.exercise.minutes > 0 && unlockAchievement('first_exercise')) newlyUnlocked.push('first_exercise');
    if (Object.values(data.prayers).every(Boolean) && unlockAchievement('prayer_warrior')) newlyUnlocked.push('prayer_warrior');
    if (data.dzikir.count >= 33 && unlockAchievement('dzikir_33')) newlyUnlocked.push('dzikir_33');
    if (data.dzikir.count >= 99 && unlockAchievement('dzikir_99')) newlyUnlocked.push('dzikir_99');
    if (balance >= 70 && unlockAchievement('balance_70')) newlyUnlocked.push('balance_70');
    if (balance >= 90 && unlockAchievement('balance_90')) newlyUnlocked.push('balance_90');
    if (streak.current >= 3 && unlockAchievement('streak_3')) newlyUnlocked.push('streak_3');
    if (streak.current >= 7 && unlockAchievement('streak_7')) newlyUnlocked.push('streak_7');
    if (streak.current >= 30 && unlockAchievement('streak_30')) newlyUnlocked.push('streak_30');
    if (data.breathing && data.breathing.sessions > 0 && unlockAchievement('first_breathing')) newlyUnlocked.push('first_breathing');
    if (data.gratitude && data.gratitude.length >= 3 && unlockAchievement('gratitude_writer')) newlyUnlocked.push('gratitude_writer');
    if (data.fasting && data.fasting.active && unlockAchievement('fasting_first')) newlyUnlocked.push('fasting_first');
    if (chatHistory.filter(m => m.role === 'user').length >= 10 && unlockAchievement('ai_chatter')) newlyUnlocked.push('ai_chatter');

    return newlyUnlocked;
  }

  function getAchievementDef(id) {
    return ACHIEVEMENT_DEFS.find(a => a.id === id);
  }

  // --- Gratitude ---
  function addGratitude(text) {
    const data = getDailyData();
    if (!data.gratitude) data.gratitude = [];
    data.gratitude.push({ text, timestamp: Date.now() });
    saveDailyData(data);
    return data;
  }

  // --- Onboarding ---
  function isOnboarded() {
    return load(KEYS.ONBOARDED, false);
  }

  function setOnboarded() {
    save(KEYS.ONBOARDED, true);
  }

  // --- Export / Import ---
  function exportData() {
    const allData = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('balancein_')) {
        allData[key] = JSON.parse(localStorage.getItem(key));
      }
    });
    return JSON.stringify(allData, null, 2);
  }

  function importData(jsonStr) {
    try {
      const allData = JSON.parse(jsonStr);
      Object.entries(allData).forEach(([key, val]) => {
        if (key.startsWith('balancein_')) {
          localStorage.setItem(key, JSON.stringify(val));
        }
      });
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  // --- Context for AI ---
  function getContextForAI() {
    const data = getDailyData();
    const settings = getSettings();
    const streak = getStreak();
    const prayersDone = Object.entries(data.prayers)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const userNameStr = settings.userName ? `Nama User: ${settings.userName}. ` : '';

    return `${userNameStr}Air: ${data.water}/${settings.waterTarget} gelas. Olahraga: ${data.exercise.minutes}/${settings.exerciseTarget} menit${data.exercise.done ? ' (selesai)' : ''}. Tidur: ${data.sleep.hours || '?'} jam. Sholat: ${prayersDone.length}/5 (${prayersDone.join(', ') || 'belum ada'}). Dzikir: ${data.dzikir.count}x. Quran: ${data.quran ? 'sudah' : 'belum'}. Streak: ${streak.current} hari. Puasa: ${data.fasting?.active ? data.fasting.type : 'tidak'}. Mood: ${data.mentalCheckin?.mood || '?'}/5. Breathing: ${data.breathing?.sessions || 0} sesi. Gratitude: ${data.gratitude?.length || 0} catatan.`;
  }

  return {
    getSettings,
    saveSettings,
    updateSetting,
    getDailyData,
    saveDailyData,
    updateDailyField,
    calculateHealthScore,
    calculateSpiritualScore,
    calculateMentalScore,
    calculateBalanceScore,
    getStreak,
    getChatHistory,
    saveChatMessage,
    clearChatHistory,
    getWeeklyHistory,
    resetAllData,
    getContextForAI,
    getTodayKey,
    ACHIEVEMENT_DEFS,
    getAchievements,
    unlockAchievement,
    checkAchievements,
    getAchievementDef,
    addGratitude,
    isOnboarded,
    setOnboarded,
    exportData,
    importData,
  };
})();
