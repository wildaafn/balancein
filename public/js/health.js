/**
 * BalanceIn — Health Tracker View
 * Water intake, exercise, sleep, and meals tracking.
 */

const Health = (() => {
  let activeTab = 'water';

  function render() {
    const container = document.getElementById('view-health');
    const data = Storage.getDailyData();
    const settings = Storage.getSettings();

    container.innerHTML = `
      <div class="section-title">
        <span class="emoji">💪</span> Kesehatan Fisik
      </div>

      <!-- Tabs -->
      <div class="tabs" id="health-tabs">
        <button class="tab ${activeTab === 'water' ? 'active' : ''}" data-tab="water">💧 Air</button>
        <button class="tab ${activeTab === 'exercise' ? 'active' : ''}" data-tab="exercise">🏃 Gerak</button>
        <button class="tab ${activeTab === 'sleep' ? 'active' : ''}" data-tab="sleep">😴 Tidur</button>
        <button class="tab ${activeTab === 'meals' ? 'active' : ''}" data-tab="meals">🍎 Makan</button>
      </div>

      <!-- Tab Content -->
      <div id="health-tab-content">
        ${renderTabContent(activeTab, data, settings)}
      </div>
    `;

    attachEvents(container);
  }

  function renderTabContent(tab, data, settings) {
    switch (tab) {
      case 'water':
        return renderWater(data, settings);
      case 'exercise':
        return renderExercise(data, settings);
      case 'sleep':
        return renderSleep(data, settings);
      case 'meals':
        return renderMeals(data);
      default:
        return '';
    }
  }

  function renderWater(data, settings) {
    const glasses = [];
    for (let i = 0; i < settings.waterTarget; i++) {
      glasses.push(`
        <div class="water-glass ${i < data.water ? 'filled' : ''}" data-glass="${i}" id="glass-${i}">
          <div class="water-fill"></div>
        </div>
      `);
    }

    const percentage = Math.round((data.water / settings.waterTarget) * 100);

    return `
      <div class="water-tracker">
        <div class="water-count">${data.water} <span style="font-size:1rem;color:var(--text-secondary)">/ ${settings.waterTarget}</span></div>
        <div class="water-target">gelas air hari ini</div>
        <div class="mini-progress mt-md" style="width:200px;height:8px;">
          <div class="mini-progress-fill health" style="width:${Math.min(100, percentage)}%;background:linear-gradient(90deg,var(--sky-500),var(--sky-400))"></div>
        </div>
        <p style="font-size:0.8rem;color:var(--text-tertiary);margin-top:8px;">${percentage >= 100 ? '🎉 Target tercapai!' : `${100 - percentage}% lagi menuju target`}</p>
        <div class="water-glasses">
          ${glasses.join('')}
        </div>
        <div style="display:flex;gap:12px;margin-top:8px;">
          <button class="btn btn-primary" id="btn-add-water" ${data.water >= settings.waterTarget ? 'disabled style="opacity:0.5"' : ''}>
            + Tambah Gelas
          </button>
          <button class="btn btn-secondary" id="btn-remove-water" ${data.water <= 0 ? 'disabled style="opacity:0.5"' : ''}>
            − Kurangi
          </button>
        </div>
      </div>
    `;
  }

  function renderExercise(data, settings) {
    const exercises = [
      { icon: '🚶', name: 'Jalan Kaki', duration: 15 },
      { icon: '🏃', name: 'Jogging', duration: 20 },
      { icon: '🧘', name: 'Yoga / Stretching', duration: 15 },
      { icon: '💪', name: 'Workout', duration: 30 },
      { icon: '🚴', name: 'Bersepeda', duration: 30 },
      { icon: '🏊', name: 'Berenang', duration: 30 },
    ];

    return `
      <div class="card mb-lg" style="text-align:center;">
        <div style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:4px;">Durasi Olahraga Hari Ini</div>
        <div style="font-family:var(--font-heading);font-size:2.5rem;font-weight:800;color:var(--emerald-400);">
          ${data.exercise.minutes}<span style="font-size:1rem;color:var(--text-secondary)"> / ${settings.exerciseTarget} mnt</span>
        </div>
        ${data.exercise.type ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;">Terakhir: ${data.exercise.type}</div>` : ''}
        <div class="mini-progress mt-md" style="height:8px;">
          <div class="mini-progress-fill health" style="width:${Math.min(100, (data.exercise.minutes / settings.exerciseTarget) * 100)}%"></div>
        </div>
      </div>

      <div class="section-title">
        <span class="emoji">⚡</span> Pilih Aktivitas
      </div>

      ${exercises
        .map(
          (ex) => `
        <div class="exercise-card" data-exercise="${ex.name}" data-duration="${ex.duration}" id="ex-${ex.name.replace(/\s/g, '')}">
          <span class="exercise-icon">${ex.icon}</span>
          <div class="exercise-info">
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-duration">${ex.duration} menit</div>
          </div>
          <button class="exercise-btn">+ Log</button>
        </div>
      `
        )
        .join('')}

      <!-- Custom Input -->
      <div class="card mt-lg">
        <div class="section-title"><span class="emoji">✏️</span> Input Manual</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="number" class="input-field" id="exercise-custom-min" placeholder="Menit" min="1" max="300" style="width:100px;">
          <input type="text" class="input-field" id="exercise-custom-type" placeholder="Jenis olahraga" style="flex:1;">
          <button class="btn btn-primary" id="btn-log-exercise" style="padding:12px 16px;">Log</button>
        </div>
      </div>
    `;
  }

  function renderSleep(data, settings) {
    const quality =
      data.sleep.hours >= settings.sleepTarget
        ? { label: 'Sangat Baik 😴', color: 'var(--emerald-400)' }
        : data.sleep.hours >= settings.sleepTarget - 1
          ? { label: 'Cukup 🙂', color: 'var(--amber-400)' }
          : data.sleep.hours > 0
            ? { label: 'Kurang 😟', color: 'var(--rose-400)' }
            : { label: 'Belum dicatat', color: 'var(--text-tertiary)' };

    return `
      <div class="sleep-card mb-lg">
        <div style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:4px;">Durasi Tidur</div>
        <div class="sleep-hours">${data.sleep.hours || '—'}<span style="font-size:1rem;color:var(--text-secondary)"> jam</span></div>
        <div class="sleep-quality" style="color:${quality.color}">${quality.label}</div>
        <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:4px;">Target: ${settings.sleepTarget} jam/malam</div>

        <div class="sleep-input-group">
          <div class="sleep-input-wrapper">
            <label class="sleep-input-label">🌙 Tidur</label>
            <input type="time" class="sleep-input" id="sleep-bedtime" value="${data.sleep.bedtime}">
          </div>
          <div class="sleep-input-wrapper">
            <label class="sleep-input-label">☀️ Bangun</label>
            <input type="time" class="sleep-input" id="sleep-wakeup" value="${data.sleep.wakeup}">
          </div>
        </div>

        <button class="btn btn-primary mt-lg" id="btn-save-sleep" style="width:100%;">Simpan Data Tidur</button>
      </div>

      <div class="card">
        <div class="section-title"><span class="emoji">💡</span> Tips Tidur</div>
        <ul style="font-size:0.85rem;color:var(--text-secondary);padding-left:20px;line-height:2;">
          <li>Tidur dan bangun pada jam yang sama setiap hari</li>
          <li>Hindari layar HP 30 menit sebelum tidur</li>
          <li>Baca doa sebelum tidur & berwudhu</li>
          <li>Pastikan kamar gelap dan sejuk</li>
        </ul>
      </div>
    `;
  }

  function renderMeals(data) {
    const meals = [
      { key: 'breakfast', icon: '🌅', name: 'Sarapan', time: '06:00 - 09:00' },
      { key: 'lunch', icon: '☀️', name: 'Makan Siang', time: '12:00 - 14:00' },
      { key: 'dinner', icon: '🌙', name: 'Makan Malam', time: '18:00 - 20:00' },
    ];

    const totalMeals = [data.meals.breakfast, data.meals.lunch, data.meals.dinner].filter(Boolean).length;

    return `
      <div class="card mb-lg" style="text-align:center;">
        <div style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:4px;">Makan Hari Ini</div>
        <div style="font-family:var(--font-heading);font-size:2.5rem;font-weight:800;color:var(--emerald-400);">
          ${totalMeals}<span style="font-size:1rem;color:var(--text-secondary)"> / 3</span>
        </div>
      </div>

      <div class="activity-list">
        ${meals
          .map(
            (meal) => `
          <div class="activity-item ${data.meals[meal.key] ? 'completed' : ''}" data-meal="${meal.key}" id="meal-${meal.key}">
            <div class="activity-check">${data.meals[meal.key] ? '✓' : ''}</div>
            <div class="activity-info">
              <div class="activity-text">${meal.name}</div>
              <div class="activity-meta">${meal.time}</div>
            </div>
            <span class="activity-emoji">${meal.icon}</span>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  function attachEvents(container) {
    // Tab switching
    container.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        render();
      });
    });

    // Water buttons
    const addWaterBtn = document.getElementById('btn-add-water');
    const removeWaterBtn = document.getElementById('btn-remove-water');

    if (addWaterBtn) {
      addWaterBtn.addEventListener('click', () => {
        const data = Storage.getDailyData();
        const settings = Storage.getSettings();
        if (data.water < settings.waterTarget) {
          data.water++;
          Storage.saveDailyData(data);
          Notifications.showToast(`💧 Gelas ke-${data.water} tercatat!`, 'success');
          if (data.water === settings.waterTarget) {
            Notifications.showToast('🎉 Target air hari ini tercapai!', 'success');
          }
          render();
        }
      });
    }

    if (removeWaterBtn) {
      removeWaterBtn.addEventListener('click', () => {
        const data = Storage.getDailyData();
        if (data.water > 0) {
          data.water--;
          Storage.saveDailyData(data);
          render();
        }
      });
    }

    // Water glasses click
    container.querySelectorAll('.water-glass').forEach((glass) => {
      glass.addEventListener('click', () => {
        const index = parseInt(glass.dataset.glass);
        const data = Storage.getDailyData();
        data.water = index + 1;
        Storage.saveDailyData(data);
        Notifications.showToast(`💧 ${data.water} gelas tercatat!`, 'success');
        render();
      });
    });

    // Exercise cards
    container.querySelectorAll('.exercise-card').forEach((card) => {
      card.addEventListener('click', () => {
        const name = card.dataset.exercise;
        const duration = parseInt(card.dataset.duration);
        const data = Storage.getDailyData();
        data.exercise.minutes += duration;
        data.exercise.type = name;
        const settings = Storage.getSettings();
        if (data.exercise.minutes >= settings.exerciseTarget) {
          data.exercise.done = true;
        }
        Storage.saveDailyData(data);
        Notifications.showToast(`🏃 ${name} +${duration} menit tercatat!`, 'success');
        render();
      });
    });

    // Custom exercise
    const logExBtn = document.getElementById('btn-log-exercise');
    if (logExBtn) {
      logExBtn.addEventListener('click', () => {
        const minutes = parseInt(document.getElementById('exercise-custom-min').value);
        const type = document.getElementById('exercise-custom-type').value;
        if (minutes > 0) {
          const data = Storage.getDailyData();
          data.exercise.minutes += minutes;
          data.exercise.type = type || 'Olahraga';
          const settings = Storage.getSettings();
          if (data.exercise.minutes >= settings.exerciseTarget) data.exercise.done = true;
          Storage.saveDailyData(data);
          Notifications.showToast(`🏃 ${type || 'Olahraga'} +${minutes} menit!`, 'success');
          render();
        } else {
          Notifications.showToast('Masukkan durasi yang valid', 'warning');
        }
      });
    }

    // Sleep
    const saveSleepBtn = document.getElementById('btn-save-sleep');
    if (saveSleepBtn) {
      saveSleepBtn.addEventListener('click', () => {
        const bedtime = document.getElementById('sleep-bedtime').value;
        const wakeup = document.getElementById('sleep-wakeup').value;
        if (bedtime && wakeup) {
          const data = Storage.getDailyData();
          data.sleep.bedtime = bedtime;
          data.sleep.wakeup = wakeup;

          // Calculate hours
          const [bH, bM] = bedtime.split(':').map(Number);
          const [wH, wM] = wakeup.split(':').map(Number);
          let hours = wH - bH + (wM - bM) / 60;
          if (hours < 0) hours += 24;
          data.sleep.hours = Math.round(hours * 10) / 10;

          Storage.saveDailyData(data);
          Notifications.showToast(`😴 Tidur ${data.sleep.hours} jam tercatat!`, 'success');
          render();
        } else {
          Notifications.showToast('Isi jam tidur dan bangun', 'warning');
        }
      });
    }

    // Meals
    container.querySelectorAll('.activity-item[data-meal]').forEach((item) => {
      item.addEventListener('click', () => {
        const meal = item.dataset.meal;
        const data = Storage.getDailyData();
        data.meals[meal] = !data.meals[meal];
        Storage.saveDailyData(data);
        const mealNames = { breakfast: 'Sarapan', lunch: 'Makan Siang', dinner: 'Makan Malam' };
        Notifications.showToast(
          data.meals[meal] ? `🍽️ ${mealNames[meal]} tercatat!` : `${mealNames[meal]} dibatalkan`,
          data.meals[meal] ? 'success' : 'info'
        );
        render();
      });
    });
  }

  return { render };
})();
