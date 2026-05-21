/**
 * BalanceIn — Mental View
 * Handles Gratitude Journal and Breathing Exercise shortcuts.
 */

const Mental = (() => {
  let container = null;

  function render() {
    container = document.getElementById('view-mental');
    if (!container) return;

    const data = Storage.getDailyData();
    const moods = ['😫', '😟', '😐', '🙂', '😄'];
    const moodLabels = ['Sangat Buruk', 'Kurang Baik', 'Biasa Saja', 'Baik', 'Sangat Baik'];
    const currentMood = data.mentalCheckin ? data.mentalCheckin.mood : 0;

    container.innerHTML = `
      <div class="header-banner" style="background: var(--gradient-mental);">
        <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 700;">Kesehatan Mental</h1>
        <p style="opacity: 0.9; margin-top: 4px; font-size: 0.9rem;">Tenangkan pikiran, syukuri hari ini.</p>
      </div>

      <div class="section-title mt-lg">
        <span class="emoji">💭</span> Bagaimana perasaanmu hari ini?
      </div>
      <div class="card mb-lg" style="text-align:center;">
        <div style="display:flex;justify-content:center;gap:12px;margin-bottom:12px;">
          ${moods.map((emoji, i) => `
            <button class="mood-btn" data-mood="${i + 1}" style="font-size:2rem;padding:8px;border-radius:12px;background:${currentMood === i + 1 ? 'var(--bg-card-hover)' : 'transparent'};border:2px solid ${currentMood === i + 1 ? 'var(--indigo-400)' : 'transparent'};cursor:pointer;transition:all 0.2s;" title="${moodLabels[i]}">${emoji}</button>
          `).join('')}
        </div>
        <div style="font-size:0.8rem;color:var(--text-secondary);">${currentMood ? `Kamu merasa: <strong>${moodLabels[currentMood-1]}</strong>` : 'Pilih emoji di atas'}</div>
      </div>

      <div class="section-title">
        <span class="emoji">🧘</span> Latihan Pernapasan
      </div>
      <div class="card mb-lg" data-nav="breathing" style="cursor:pointer; display:flex; align-items:center; justify-content:space-between; border-left:3px solid var(--indigo-400);">
        <div>
          <div style="font-weight:600;font-size:0.95rem;color:var(--text-primary);">Pernapasan 4-7-8</div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:2px;">Kurangi stres dan rasa cemas</div>
        </div>
        <div style="font-size:1.5rem;">✨</div>
      </div>

      <div class="section-title">
        <span class="emoji">🤲</span> Jurnal Syukur
      </div>
      <div class="card mb-lg" style="border-left:3px solid var(--emerald-400);">
        <div class="gratitude-input-area">
          <input type="text" class="input-field" id="mental-gratitude-input" placeholder="Apa yang kamu syukuri hari ini?">
          <button class="btn btn-primary" id="mental-gratitude-add" style="padding:0 20px;">+</button>
        </div>
        <div class="gratitude-list" id="mental-gratitude-list">
          ${(data.gratitude || []).map(g => `<div class="gratitude-item">${g.text}</div>`).join('')}
          ${(!data.gratitude || data.gratitude.length === 0) ? '<div style="font-size:0.8rem;color:var(--text-tertiary);text-align:center;padding:12px 0;">Belum ada catatan syukur hari ini.</div>' : ''}
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Breathing nav
    const breathingCard = container.querySelector('[data-nav="breathing"]');
    if (breathingCard) {
      breathingCard.addEventListener('click', () => {
        App.navigateTo('breathing');
      });
    }

    // Gratitude add
    const btnAdd = document.getElementById('mental-gratitude-add');
    const input = document.getElementById('mental-gratitude-input');

    if (btnAdd && input) {
      const addGratitude = () => {
        const text = input.value.trim();
        if (text) {
          Storage.addGratitude(text);
          input.value = '';
          render();
          Notifications.showToast('Alhamdulillah, rasa syukur dicatat!', 'success');
        }
      };

      btnAdd.addEventListener('click', addGratitude);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addGratitude();
      });
    }

    // Mood checkin
    const moodBtns = container.querySelectorAll('.mood-btn');
    moodBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mood = parseInt(btn.dataset.mood);
        const moods = ['😫', '😟', '😐', '🙂', '😄'];
        const moodLabels = ['Sangat Buruk', 'Kurang Baik', 'Biasa Saja', 'Baik', 'Sangat Baik'];
        
        Storage.updateDailyField('mentalCheckin.mood', mood);
        Notifications.showToast(`Mood tercatat: ${moods[mood - 1]} ${moodLabels[mood - 1]}`, 'success');
        render(); // Re-render to update the selected state
      });
    });
  }

  return { render };
})();
