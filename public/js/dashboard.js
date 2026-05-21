/**
 * BalanceIn — Dashboard View
 * Main overview with balance score, pilar cards, quote, and today's activities.
 */

const Dashboard = (() => {
  let quoteData = null;

  function render() {
    const container = document.getElementById('view-dashboard');
    const data = Storage.getDailyData();
    const streak = Storage.getStreak();
    const healthScore = Storage.calculateHealthScore(data);
    const mentalScore = Storage.calculateMentalScore(data);
    const spiritualScore = Storage.calculateSpiritualScore(data);
    const balanceScore = Storage.calculateBalanceScore(data);

    const prayersDone = Object.values(data.prayers).filter(Boolean).length;
    const settings = Storage.getSettings();

    container.innerHTML = `
      <!-- Greeting -->
      <div style="margin-bottom: var(--space-md);">
        <h2 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--text-primary); margin-bottom: 2px;">
          ${settings.userName ? `Assalamu'alaikum, ${settings.userName}!` : 'Assalamu\'alaikum!'}
        </h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Semoga harimu seimbang dan penuh berkah ✨</p>
      </div>

      <!-- Balance Score Ring -->
      <div class="balance-ring-container">
        ${streak.current > 0 ? `<div class="streak-badge mb-md">🔥 ${streak.current} hari streak</div>` : ''}
        <div class="balance-ring">
          <svg viewBox="0 0 170 170">
            <circle class="balance-ring-bg" cx="85" cy="85" r="72" />
            <circle class="balance-ring-fill" cx="85" cy="85" r="72"
              id="balance-ring-circle"
              style="stroke-dashoffset: ${452 - (452 * balanceScore) / 100}" />
          </svg>
          <div class="balance-ring-content">
            <span class="balance-score" id="balance-score-display">${balanceScore}</span>
            <span class="balance-label">Balance Score</span>
          </div>
        </div>
      </div>

      <!-- 3 Pilar Cards -->
      <div class="pilar-grid">
        <div class="pilar-card health" data-nav="health" id="pilar-health">
          <span class="pilar-icon">💪</span>
          <span class="pilar-label">Fisik</span>
          <span class="pilar-value">${healthScore}%</span>
          <div class="mini-progress">
            <div class="mini-progress-fill health" style="width: ${healthScore}%"></div>
          </div>
        </div>
        <div class="pilar-card mental" id="pilar-mental">
          <span class="pilar-icon">🧠</span>
          <span class="pilar-label">Mental</span>
          <span class="pilar-value">${mentalScore}%</span>
          <div class="mini-progress">
            <div class="mini-progress-fill mental" style="width: ${mentalScore}%"></div>
          </div>
        </div>
        <div class="pilar-card spiritual" data-nav="spiritual" id="pilar-spiritual">
          <span class="pilar-icon">🕌</span>
          <span class="pilar-label">Spiritual</span>
          <span class="pilar-value">${spiritualScore}%</span>
          <div class="mini-progress">
            <div class="mini-progress-fill spiritual" style="width: ${spiritualScore}%"></div>
          </div>
        </div>
      </div>

      <!-- Daily Quote -->
      <div class="quote-card" id="quote-card">
        <p class="quote-text" id="quote-text">${quoteData ? quoteData.text : 'Memuat motivasi hari ini...'}</p>
        <span class="quote-source" id="quote-source">${quoteData ? `— ${quoteData.source}` : ''}</span>
      </div>

      <!-- Mental Health & Focus -->
      <div class="section-title mt-lg">
        <span class="emoji">🧘</span> Ketenangan Jiwa
      </div>
      <div class="card mb-lg" data-nav="breathing" style="cursor:pointer; display:flex; align-items:center; justify-content:space-between; border-left:3px solid var(--indigo-400);">
        <div>
          <div style="font-weight:600;font-size:0.95rem;color:var(--text-primary);">Latihan Pernapasan</div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:2px;">Tenangkan pikiran dan hati</div>
        </div>
        <div style="font-size:1.5rem;">✨</div>
      </div>

      <!-- Gratitude Journal -->
      <div class="section-title">
        <span class="emoji">🤲</span> Jurnal Syukur
      </div>
      <div class="card mb-lg" style="border-left:3px solid var(--emerald-400);">
        <div class="gratitude-input-area">
          <input type="text" class="input-field" id="gratitude-input" placeholder="Apa yang kamu syukuri hari ini?">
          <button class="btn btn-primary" id="gratitude-add" style="padding:0 20px;">+</button>
        </div>
        <div class="gratitude-list" id="gratitude-list">
          ${(data.gratitude || []).map(g => `<div class="gratitude-item">${g.text}</div>`).join('')}
          ${(!data.gratitude || data.gratitude.length === 0) ? '<div style="font-size:0.8rem;color:var(--text-tertiary);text-align:center;padding:12px 0;">Belum ada catatan syukur hari ini.</div>' : ''}
        </div>
      </div>

      <!-- Today's Activities -->
      <div class="section-title">
        <span class="emoji">📋</span> Aktivitas Hari Ini
      </div>
      <div class="activity-list">
        <div class="activity-item ${data.prayers.fajr ? 'completed' : ''}" data-action="prayer-fajr" id="activity-fajr">
          <div class="activity-check">${data.prayers.fajr ? '✓' : ''}</div>
          <div class="activity-info">
            <div class="activity-text">Sholat Subuh</div>
            <div class="activity-meta">Sholat 5 waktu</div>
          </div>
          <span class="activity-emoji">🕌</span>
        </div>

        <div class="activity-item ${data.water >= settings.waterTarget ? 'completed' : ''}" data-action="water" id="activity-water">
          <div class="activity-check">${data.water >= settings.waterTarget ? '✓' : ''}</div>
          <div class="activity-info">
            <div class="activity-text">Minum Air ${data.water}/${settings.waterTarget} gelas</div>
            <div class="activity-meta">Target harian</div>
          </div>
          <span class="activity-emoji">💧</span>
        </div>

        <div class="activity-item ${data.exercise.done ? 'completed' : ''}" data-action="exercise" id="activity-exercise">
          <div class="activity-check">${data.exercise.done ? '✓' : ''}</div>
          <div class="activity-info">
            <div class="activity-text">Olahraga ${data.exercise.minutes}/${settings.exerciseTarget} menit</div>
            <div class="activity-meta">Aktivitas fisik</div>
          </div>
          <span class="activity-emoji">🏃</span>
        </div>

        <div class="activity-item ${data.quran ? 'completed' : ''}" data-action="quran" id="activity-quran">
          <div class="activity-check">${data.quran ? '✓' : ''}</div>
          <div class="activity-info">
            <div class="activity-text">Baca Al-Quran</div>
            <div class="activity-meta">Tilawah harian</div>
          </div>
          <span class="activity-emoji">📖</span>
        </div>

        <div class="activity-item ${prayersDone >= 5 ? 'completed' : ''}" id="activity-allprayers">
          <div class="activity-check">${prayersDone >= 5 ? '✓' : ''}</div>
          <div class="activity-info">
            <div class="activity-text">Sholat ${prayersDone}/5 waktu</div>
            <div class="activity-meta">Target semua waktu</div>
          </div>
          <span class="activity-emoji">✅</span>
        </div>
      </div>

      <!-- AI Weekly Report -->
      <div class="card mt-xl" style="text-align:center;background:var(--gradient-primary);border:none;box-shadow:var(--shadow-glow-emerald);">
        <div style="font-size:2rem;margin-bottom:8px;">🤖</div>
        <h3 style="font-family:var(--font-heading);font-size:1.1rem;color:white;margin-bottom:4px;">Laporan Mingguan AI</h3>
        <p style="font-size:0.8rem;color:rgba(255,255,255,0.8);margin-bottom:16px;">Analisis progress dan saran personal untuk kamu</p>
        <button class="btn btn-secondary" id="btn-ai-report" style="width:100%;background:rgba(255,255,255,0.2);color:white;border-color:rgba(255,255,255,0.3);">
          Lihat Laporan AI
        </button>
      </div>

      <!-- Weekly Chart -->
      <div class="section-title mt-lg">
        <span class="emoji">📊</span> Progres Minggu Ini
      </div>
      <div class="card mb-xl">
        ${renderWeeklyChart()}
      </div>
    `;

    // Attach events
    attachEvents(container);

    // Load quote if not cached
    if (!quoteData) loadQuote();
  }

  function renderWeeklyChart() {
    const history = Storage.getWeeklyHistory();
    return `
      <div class="weekly-chart">
        ${history
          .map(
            (day) => `
          <div class="chart-bar-wrapper">
            <div class="chart-bar" style="height: ${Math.max(4, day.balance)}%"></div>
            <span class="chart-day">${day.day}</span>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  async function loadQuote() {
    try {
      const res = await fetch('/api/ai/motivation');
      const data = await res.json();
      if (data.success && data.quote) {
        quoteData = data.quote;
        const textEl = document.getElementById('quote-text');
        const sourceEl = document.getElementById('quote-source');
        if (textEl) textEl.textContent = quoteData.text;
        if (sourceEl) sourceEl.textContent = `— ${quoteData.source}`;
      }
    } catch (e) {
      console.error('Failed to load quote:', e);
      const textEl = document.getElementById('quote-text');
      if (textEl) textEl.textContent = 'Jaga keseimbanganmu hari ini. Tubuh, pikiran, dan hati — semuanya penting. ✨';
    }
  }

  function attachEvents(container) {
    // Pilar cards → navigate to respective views
    container.querySelectorAll('.pilar-card[data-nav]').forEach((card) => {
      card.addEventListener('click', () => {
        const view = card.dataset.nav;
        if (window.App) App.navigateTo(view);
      });
    });

    // Mental pilar → show mood check-in
    const mentalCard = document.getElementById('pilar-mental');
    if (mentalCard) {
      mentalCard.addEventListener('click', () => showMoodCheckin());
    }

    // Breathing Navigation
    const breathingCard = container.querySelector('.card[data-nav="breathing"]');
    if (breathingCard) {
      breathingCard.addEventListener('click', () => {
        if (window.App) App.navigateTo('breathing');
      });
    }

    // Gratitude Submit
    const gratInput = document.getElementById('gratitude-input');
    const gratBtn = document.getElementById('gratitude-add');
    if (gratBtn && gratInput) {
      const addGratitude = () => {
        const text = gratInput.value.trim();
        if (text) {
          Storage.addGratitude(text);
          gratInput.value = '';
          Notifications.showToast('Jurnal syukur ditambahkan! ✨', 'success');
          Storage.checkAchievements().forEach(id => {
            const def = Storage.getAchievementDef(id);
            if (def) Notifications.showToast(`🏆 Achievement: ${def.name}!`, 'success');
          });
          render();
        }
      };
      gratBtn.addEventListener('click', addGratitude);
      gratInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addGratitude();
      });
    }

    // AI Report Request
    const btnAiReport = document.getElementById('btn-ai-report');
    if (btnAiReport) {
      btnAiReport.addEventListener('click', () => {
        if (window.App) {
          App.navigateTo('ai');
          setTimeout(() => {
            const input = document.getElementById('chat-input');
            const sendBtn = document.getElementById('chat-send');
            if (input && sendBtn) {
              input.value = "Tolong buatkan Laporan Mingguan AI berdasarkan progress saya minggu ini.";
              sendBtn.click();
            }
          }, 300);
        }
      });
    }

    // Activity items
    container.querySelectorAll('.activity-item[data-action]').forEach((item) => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        handleActivityAction(action);
      });
    });
  }

  function handleActivityAction(action) {
    const data = Storage.getDailyData();
    if (action === 'prayer-fajr') {
      data.prayers.fajr = !data.prayers.fajr;
      Storage.saveDailyData(data);
      Notifications.showToast(data.prayers.fajr ? 'Alhamdulillah, sholat Subuh tercatat! 🕌' : 'Sholat Subuh dibatalkan', data.prayers.fajr ? 'success' : 'info');
    } else if (action === 'water') {
      if (window.App) App.navigateTo('health');
    } else if (action === 'exercise') {
      if (window.App) App.navigateTo('health');
    } else if (action === 'quran') {
      data.quran = !data.quran;
      Storage.saveDailyData(data);
      Notifications.showToast(data.quran ? 'MasyaAllah, tilawah hari ini tercatat! 📖' : 'Tilawah dibatalkan', data.quran ? 'success' : 'info');
    }
    render();
  }

  function showMoodCheckin() {
    const data = Storage.getDailyData();
    const moods = ['😫', '😟', '😐', '🙂', '😄'];
    const moodLabels = ['Sangat Buruk', 'Kurang Baik', 'Biasa Saja', 'Baik', 'Sangat Baik'];

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:500;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(8px);animation:fadeInUp 0.3s ease-out;';

    overlay.innerHTML = `
      <div class="card" style="width:100%;max-width:360px;text-align:center;">
        <h3 style="font-family:var(--font-heading);font-size:1.2rem;margin-bottom:8px;">Bagaimana perasaanmu hari ini?</h3>
        <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:24px;">Check-in mental harian</p>
        <div style="display:flex;justify-content:center;gap:12px;margin-bottom:24px;">
          ${moods
            .map(
              (emoji, i) => `
            <button class="mood-btn" data-mood="${i + 1}" style="font-size:2rem;padding:8px;border-radius:12px;background:${data.mentalCheckin.mood === i + 1 ? 'var(--bg-card-hover)' : 'transparent'};border:2px solid ${data.mentalCheckin.mood === i + 1 ? 'var(--indigo-400)' : 'transparent'};cursor:pointer;transition:all 0.2s;" title="${moodLabels[i]}">${emoji}</button>
          `
            )
            .join('')}
        </div>
        <button class="btn btn-secondary" id="mood-close" style="width:100%;">Tutup</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.mood-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mood = parseInt(btn.dataset.mood);
        Storage.updateDailyField('mentalCheckin.mood', mood);
        Notifications.showToast(`Mood tercatat: ${moods[mood - 1]} ${moodLabels[mood - 1]}`, 'success');
        overlay.remove();
        render();
      });
    });

    overlay.querySelector('#mood-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  return { render };
})();
