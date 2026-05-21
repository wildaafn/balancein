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
        <div class="pilar-card mental" data-nav="mental" id="pilar-mental">
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

      <!-- The Gratitude, Breathing, and Checklists have been moved to their respective tabs -->

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

    // Removed events as elements were moved to mental.js
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

    // Checklists moved to their respective tabs.

  return { render };
})();
