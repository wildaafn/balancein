/**
 * BalanceIn — Notification System
 * Handles in-app toast notifications and browser notifications.
 */

const Notifications = (() => {
  let toastContainer = null;

  function init() {
    toastContainer = document.getElementById('toast-container');
  }

  // --- Toast (In-App) Notifications ---
  function showToast(message, type = 'info', duration = 3500) {
    if (!toastContainer) init();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || '📌'}</span><span>${message}</span>`;

    toast.style.animationDuration = `0.4s, 0.3s`;
    toast.style.animationDelay = `0s, ${duration / 1000}s`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, duration + 500);
  }

  // --- Browser Notifications ---
  function isSupported() {
    return 'Notification' in window;
  }

  function getPermission() {
    return isSupported() ? Notification.permission : 'denied';
  }

  async function requestPermission(silent = false) {
    if (!isSupported()) {
      if (!silent) showToast('Browser kamu belum mendukung notifikasi', 'warning');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      if (!silent) showToast('Notifikasi diblokir. Aktifkan di pengaturan browser.', 'warning');
      return false;
    }

    const result = await Notification.requestPermission();
    if (result === 'granted') {
      Storage.updateSetting('notificationsEnabled', true);
      showToast('Notifikasi berhasil diaktifkan! 🔔', 'success');
      return true;
    }

    if (!silent) showToast('Notifikasi tidak diizinkan', 'info');
    return false;
  }

  function sendNotification(title, body, tag = 'balancein') {
    if (getPermission() !== 'granted') return;

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          tag,
        });
      } else {
        new Notification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag,
          vibrate: [200, 100, 200],
        });
      }
    } catch (e) {
      console.error('Notification error:', e);
    }
  }

  // --- Scheduled Reminders ---
  const reminders = [];

  function scheduleReminder(id, delayMs, title, body) {
    // Clear existing reminder with same id
    cancelReminder(id);

    const timer = setTimeout(() => {
      sendNotification(title, body, id);
      showToast(body, 'info');
    }, delayMs);

    reminders.push({ id, timer });
  }

  function cancelReminder(id) {
    const idx = reminders.findIndex((r) => r.id === id);
    if (idx !== -1) {
      clearTimeout(reminders[idx].timer);
      reminders.splice(idx, 1);
    }
  }

  // --- Prayer Time Reminders ---
  function schedulePrayerReminders(timings) {
    if (!timings) return;

    const now = new Date();
    const prayerNames = {
      Fajr: 'Subuh',
      Dhuhr: 'Dzuhur',
      Asr: 'Ashar',
      Maghrib: 'Maghrib',
      Isha: 'Isya',
    };

    Object.entries(prayerNames).forEach(([key, name]) => {
      const time = timings[key];
      if (!time) return;

      const [hours, minutes] = time.split(':').map(Number);
      const prayerTime = new Date(now);
      prayerTime.setHours(hours, minutes, 0, 0);

      // Remind 5 minutes before
      const reminderTime = new Date(prayerTime.getTime() - 5 * 60 * 1000);
      const delay = reminderTime.getTime() - now.getTime();

      if (delay > 0) {
        scheduleReminder(
          `prayer-${key}`,
          delay,
          `🕌 Waktu ${name} Hampir Tiba`,
          `Bersiaplah untuk sholat ${name} pukul ${time}. Semoga Allah menerima ibadahmu 🤲`
        );
      }
    });
  }

  // --- Water Reminders ---
  function scheduleWaterReminder() {
    const settings = Storage.getSettings();
    if (!settings.waterReminder) return;

    // Remind every 2 hours during awake time (7 AM - 10 PM)
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 7 && hour < 22) {
      const nextReminder = new Date(now);
      nextReminder.setHours(hour + 2, 0, 0, 0);
      const delay = nextReminder.getTime() - now.getTime();

      if (delay > 0 && delay < 3 * 60 * 60 * 1000) {
        scheduleReminder(
          'water-reminder',
          delay,
          '💧 Waktunya Minum Air',
          'Jangan lupa minum air putih ya! Tetap terhidrasi untuk tubuh yang sehat 💪'
        );
      }
    }
  }

  return {
    init,
    showToast,
    isSupported,
    getPermission,
    requestPermission,
    sendNotification,
    scheduleReminder,
    cancelReminder,
    schedulePrayerReminders,
    scheduleWaterReminder,
  };
})();
