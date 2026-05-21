/**
 * BalanceIn — Breathing Exercise
 * Guided breathing with visual circle animation (4-7-8 technique).
 */

const Breathing = (() => {
  let isRunning = false;
  let currentPhase = null;
  let timer = null;
  let totalCycles = 0;
  let currentCycle = 0;

  const techniques = [
    { id: 'relax', name: 'Relaksasi 4-7-8', inhale: 4, hold: 7, exhale: 8, cycles: 4, desc: 'Teknik terbaik untuk menenangkan pikiran & tidur lebih nyenyak' },
    { id: 'calm', name: 'Tenangkan Diri 4-4-4', inhale: 4, hold: 4, exhale: 4, cycles: 6, desc: 'Box breathing — ideal untuk mengatasi kecemasan & stres' },
    { id: 'energy', name: 'Energize 4-2-6', inhale: 4, hold: 2, exhale: 6, cycles: 5, desc: 'Tambah energi dan fokus di pagi hari' },
  ];

  function render() {
    const container = document.getElementById('view-breathing');
    if (!container) return;

    const data = Storage.getDailyData();
    const sessions = data.breathing?.sessions || 0;

    container.innerHTML = `
      <div class="section-title">
        <span class="emoji">🧘</span> Latihan Pernapasan
      </div>
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:24px;">
        Tenangkan pikiran dan hati dengan teknik pernapasan. Baik untuk kesehatan mental dan persiapan ibadah.
      </p>

      ${sessions > 0 ? `<div class="streak-badge mb-lg">🧘 ${sessions} sesi hari ini</div>` : ''}

      <!-- Breathing Circle -->
      <div class="breathing-container" id="breathing-container">
        <div class="breathing-circle" id="breathing-circle">
          <div class="breathing-inner">
            <div class="breathing-text" id="breathing-text">Pilih Teknik</div>
            <div class="breathing-timer" id="breathing-timer"></div>
          </div>
        </div>
        <div class="breathing-progress" id="breathing-progress"></div>
      </div>

      <!-- Technique Selection -->
      <div class="section-title mt-lg">
        <span class="emoji">✨</span> Pilih Teknik
      </div>

      ${techniques.map(t => `
        <div class="card mb-md breathing-technique-card" data-technique="${t.id}" id="technique-${t.id}" style="cursor:pointer;">
          <div class="flex-between">
            <div>
              <div style="font-weight:600;font-size:0.95rem;color:var(--text-primary);">${t.name}</div>
              <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:2px;">${t.desc}</div>
            </div>
            <div style="font-family:var(--font-heading);font-weight:700;color:var(--indigo-400);white-space:nowrap;margin-left:12px;">
              ${t.inhale}-${t.hold}-${t.exhale}
            </div>
          </div>
          <button class="btn btn-primary mt-md" style="width:100%;padding:10px;" data-start="${t.id}">
            Mulai Sesi
          </button>
        </div>
      `).join('')}

      <!-- Islamic Connection -->
      <div class="card mt-lg" style="border-left:3px solid var(--amber-400);">
        <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8;">
          💡 <strong style="color:var(--amber-400);">Tips:</strong> Lakukan latihan pernapasan sebelum sholat untuk meningkatkan kekhusyukan. Rasulullah ﷺ menganjurkan ketenangan sebelum beribadah.
        </div>
      </div>
    `;

    attachEvents(container);
  }

  function attachEvents(container) {
    container.querySelectorAll('[data-start]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.start;
        const technique = techniques.find(t => t.id === id);
        if (technique) startSession(technique);
      });
    });
  }

  function startSession(technique) {
    if (isRunning) return;
    isRunning = true;
    totalCycles = technique.cycles;
    currentCycle = 0;

    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breathing-text');
    const timerEl = document.getElementById('breathing-timer');
    const progress = document.getElementById('breathing-progress');

    if (circle) circle.classList.add('active');
    if (progress) progress.innerHTML = `Siklus 1/${totalCycles} — ${technique.name}`;

    runCycle(technique, circle, text, timerEl, progress);
  }

  function runCycle(technique, circle, text, timerEl, progress) {
    if (currentCycle >= totalCycles) {
      finishSession(circle, text, timerEl, progress);
      return;
    }

    currentCycle++;
    if (progress) progress.innerHTML = `Siklus ${currentCycle}/${totalCycles} — ${technique.name}`;

    // Phase 1: Inhale
    runPhase('Tarik Napas...', technique.inhale, 'inhale', circle, text, timerEl, () => {
      // Phase 2: Hold
      runPhase('Tahan...', technique.hold, 'hold', circle, text, timerEl, () => {
        // Phase 3: Exhale
        runPhase('Hembuskan...', technique.exhale, 'exhale', circle, text, timerEl, () => {
          runCycle(technique, circle, text, timerEl, progress);
        });
      });
    });
  }

  function runPhase(label, duration, phase, circle, text, timerEl, onComplete) {
    currentPhase = phase;
    if (text) text.textContent = label;
    if (circle) {
      circle.className = 'breathing-circle active ' + phase;
      circle.style.setProperty('--phase-duration', duration + 's');
    }

    let remaining = duration;
    if (timerEl) timerEl.textContent = remaining;

    timer = setInterval(() => {
      remaining--;
      if (timerEl) timerEl.textContent = remaining > 0 ? remaining : '';
      if (remaining <= 0) {
        clearInterval(timer);
        onComplete();
      }
    }, 1000);
  }

  function finishSession(circle, text, timerEl, progress) {
    isRunning = false;
    currentPhase = null;

    if (circle) circle.className = 'breathing-circle';
    if (text) text.textContent = 'Selesai! 🌟';
    if (timerEl) timerEl.textContent = '';
    if (progress) progress.innerHTML = 'Alhamdulillah, sesi selesai!';

    // Save session
    const data = Storage.getDailyData();
    if (!data.breathing) data.breathing = { sessions: 0 };
    data.breathing.sessions++;
    Storage.saveDailyData(data);

    // Check achievements
    const newAchievements = Storage.checkAchievements();
    newAchievements.forEach(id => {
      const def = Storage.getAchievementDef(id);
      if (def) Notifications.showToast(`🏆 Achievement: ${def.name}!`, 'success');
    });

    Notifications.showToast('🧘 Sesi pernapasan selesai! Semoga tenang dan khusyuk.', 'success');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    setTimeout(() => {
      if (text) text.textContent = 'Pilih Teknik';
    }, 3000);
  }

  function stop() {
    if (timer) clearInterval(timer);
    isRunning = false;
  }

  return { render, stop };
})();
