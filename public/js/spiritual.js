/**
 * BalanceIn — Spiritual / Ibadah View
 * Prayer times, prayer checklist, dzikir counter, kiblat compass,
 * fasting tracker, Quran reminder, daily doa.
 */

const Spiritual = (() => {
  let activeTab = 'prayer';
  let prayerTimings = null;
  let hijriDate = null;
  let deviceHeading = null;

  function render() {
    const container = document.getElementById('view-spiritual');
    const data = Storage.getDailyData();
    const streak = Storage.getStreak();

    container.innerHTML = `
      <div class="flex-between mb-md">
        <div class="section-title" style="margin-bottom:0;">
          <span class="emoji">🕌</span> Ibadah
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          ${hijriDate ? `<div class="hijri-date">🌙 ${hijriDate}</div>` : ''}
          ${streak.current > 0 ? `<div class="streak-badge">🔥 ${streak.current}</div>` : ''}
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs" id="spiritual-tabs" style="flex-wrap:nowrap;overflow-x:auto;">
        <button class="tab ${activeTab === 'prayer' ? 'active' : ''}" data-tab="prayer">🕌 Sholat</button>
        <button class="tab ${activeTab === 'dzikir' ? 'active' : ''}" data-tab="dzikir">📿 Dzikir</button>
        <button class="tab ${activeTab === 'kiblat' ? 'active' : ''}" data-tab="kiblat">🧭 Kiblat</button>
        <button class="tab ${activeTab === 'fasting' ? 'active' : ''}" data-tab="fasting">🌙 Puasa</button>
        <button class="tab ${activeTab === 'doa' ? 'active' : ''}" data-tab="doa">🤲 Doa</button>
      </div>

      <div id="spiritual-tab-content">
        ${renderTabContent(activeTab, data)}
      </div>
    `;

    attachEvents(container);
    if (!prayerTimings) loadPrayerTimes();
  }

  function renderTabContent(tab, data) {
    switch (tab) {
      case 'prayer': return renderPrayer(data);
      case 'dzikir': return renderDzikir(data);
      case 'kiblat': return renderKiblat();
      case 'fasting': return renderFasting(data);
      case 'doa': return renderDoa();
      default: return '';
    }
  }

  function renderPrayer(data) {
    const prayers = [
      { key: 'fajr', name: 'Subuh', apiKey: 'Fajr', icon: '🌅' },
      { key: 'dhuhr', name: 'Dzuhur', apiKey: 'Dhuhr', icon: '☀️' },
      { key: 'asr', name: 'Ashar', apiKey: 'Asr', icon: '🌤️' },
      { key: 'maghrib', name: 'Maghrib', apiKey: 'Maghrib', icon: '🌅' },
      { key: 'isha', name: 'Isya', apiKey: 'Isha', icon: '🌙' },
    ];

    const prayersDone = Object.values(data.prayers).filter(Boolean).length;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let activePrayerKey = null;
    if (prayerTimings) {
      const prayerMinutes = prayers.map(p => {
        const time = prayerTimings[p.apiKey];
        if (!time) return Infinity;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      });
      for (let i = prayerMinutes.length - 1; i >= 0; i--) {
        if (currentMinutes >= prayerMinutes[i]) { activePrayerKey = prayers[i].key; break; }
      }
      if (!activePrayerKey) activePrayerKey = prayers[0].key;
    }

    return `
      <div class="card mb-lg" style="text-align:center;">
        <div style="font-size:0.8rem;color:var(--text-tertiary);">Sholat Hari Ini</div>
        <div style="font-family:var(--font-heading);font-size:2.5rem;font-weight:800;color:var(--amber-400);">
          ${prayersDone}<span style="font-size:1rem;color:var(--text-secondary)"> / 5</span>
        </div>
        <div class="mini-progress mt-md" style="height:8px;">
          <div class="mini-progress-fill spiritual" style="width:${(prayersDone / 5) * 100}%"></div>
        </div>
        ${prayersDone === 5 ? '<p style="color:var(--amber-400);font-size:0.85rem;margin-top:8px;">🎉 MasyaAllah, semua sholat tercatat!</p>' : ''}
      </div>

      <div class="prayer-list">
        ${prayers.map(p => `
          <div class="prayer-item ${data.prayers[p.key] ? 'completed' : ''} ${activePrayerKey === p.key && !data.prayers[p.key] ? 'active-prayer' : ''}"
               data-prayer="${p.key}" id="prayer-${p.key}">
            <div class="prayer-check">${data.prayers[p.key] ? '✓' : ''}</div>
            <span style="font-size:1.2rem;">${p.icon}</span>
            <span class="prayer-name">${p.name}</span>
            <span class="prayer-time">${prayerTimings ? prayerTimings[p.apiKey] || '--:--' : '...'}</span>
          </div>
        `).join('')}
      </div>

      <div class="activity-item mt-lg ${data.quran ? 'completed' : ''}" id="quran-toggle" style="cursor:pointer;">
        <div class="activity-check">${data.quran ? '✓' : ''}</div>
        <div class="activity-info">
          <div class="activity-text">📖 Tilawah Al-Quran</div>
          <div class="activity-meta">Baca Al-Quran hari ini</div>
        </div>
      </div>
    `;
  }

  function renderDzikir(data) {
    const dzikirTypes = [
      { name: 'Subhanallah', arabic: 'سُبْحَانَ اللَّهِ', target: 33 },
      { name: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', target: 33 },
      { name: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', target: 33 },
    ];

    return `
      <div class="dzikir-counter">
        <div class="dzikir-display" id="dzikir-count">${data.dzikir.count}</div>
        <div class="dzikir-label">Total dzikir hari ini</div>
        <button class="dzikir-btn" id="dzikir-tap">📿</button>
        <div class="dzikir-actions">
          <button class="dzikir-action-btn" id="dzikir-reset">Reset</button>
          <button class="dzikir-action-btn" id="dzikir-set-target">Target: ${data.dzikir.target}</button>
        </div>
      </div>
      <div class="section-title mt-lg"><span class="emoji">✨</span> Dzikir Harian</div>
      ${dzikirTypes.map(dz => `
        <div class="card mb-md" style="text-align:center;">
          <div style="font-size:1.6rem;direction:rtl;color:var(--text-primary);margin-bottom:4px;">${dz.arabic}</div>
          <div style="font-size:0.85rem;color:var(--amber-400);font-weight:600;">${dz.name}</div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:2px;">Dianjurkan ${dz.target}×</div>
        </div>
      `).join('')}
    `;
  }

  function renderKiblat() {
    const settings = Storage.getSettings();
    const qiblaAngle = calculateQiblaDirection(settings.location.latitude, settings.location.longitude);

    return `
      <div class="compass-container">
        <div class="compass" id="compass">
          <span class="compass-label n">U</span>
          <span class="compass-label s">S</span>
          <span class="compass-label e">T</span>
          <span class="compass-label w">B</span>
          <div class="compass-arrow" id="compass-arrow" style="transform: translateX(-50%) rotate(${qiblaAngle}deg);">
            <span class="compass-kaaba">🕋</span>
          </div>
          <div class="compass-center"></div>
        </div>
        <div class="compass-direction">Arah Kiblat: ${Math.round(qiblaAngle)}°</div>
        <div class="compass-info">dari ${settings.location.city || 'lokasi Anda'}</div>

        <button class="btn btn-primary mt-lg" id="btn-start-compass">
          🧭 Aktifkan Kompas Real-time
        </button>
        <p style="font-size:0.75rem;color:var(--text-tertiary);margin-top:12px;text-align:center;max-width:280px;">
          Arahkan panah hijau ke depan kamu. Panah menunjukkan arah kiblat relatif dari utara.
        </p>
      </div>

      <div class="card mt-lg" style="border-left:3px solid var(--amber-400);">
        <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8;">
          💡 <strong style="color:var(--amber-400);">Cara Penggunaan:</strong><br>
          1. Tekan "Aktifkan Kompas Real-time"<br>
          2. Pegang HP mendatar di tangan<br>
          3. Putar badan hingga panah hijau menunjuk ke atas (🕋)<br>
          4. Arah depan kamu adalah arah kiblat
        </div>
      </div>
    `;
  }

  function renderFasting(data) {
    const fastingTypes = [
      { id: 'senin', name: 'Senin', desc: 'Puasa Senin' },
      { id: 'kamis', name: 'Kamis', desc: 'Puasa Kamis' },
      { id: 'ayyamul_bidh', name: 'Ayyamul Bidh', desc: '13, 14, 15 Hijriyah' },
      { id: 'daud', name: 'Puasa Daud', desc: 'Sehari puasa, sehari tidak' },
      { id: 'arafah', name: 'Arafah', desc: '9 Dzulhijjah' },
      { id: 'lainnya', name: 'Lainnya', desc: 'Puasa sunnah lainnya' },
    ];

    const isActive = data.fasting?.active;
    const activeType = data.fasting?.type;

    return `
      <div class="fasting-card">
        <div style="font-size:2rem;margin-bottom:8px;">${isActive ? '🌙' : '🍽️'}</div>
        <div style="font-family:var(--font-heading);font-size:1.3rem;font-weight:700;color:${isActive ? 'var(--amber-400)' : 'var(--text-secondary)'};">
          ${isActive ? `Sedang Puasa ${activeType}` : 'Tidak Sedang Puasa'}
        </div>
        ${isActive ? `
          <button class="btn btn-danger mt-lg" id="btn-break-fast" style="width:100%;">
            🍽️ Batal / Sudah Buka
          </button>
        ` : ''}
      </div>

      ${!isActive ? `
        <div class="section-title"><span class="emoji">✨</span> Mulai Puasa Sunnah</div>
        <div class="fasting-types">
          ${fastingTypes.map(ft => `
            <button class="fasting-type-btn" data-fasting="${ft.id}" data-name="${ft.name}">
              <div style="font-weight:600;">${ft.name}</div>
              <div style="font-size:0.7rem;color:var(--text-tertiary);margin-top:2px;">${ft.desc}</div>
            </button>
          `).join('')}
        </div>
      ` : ''}

      <div class="card mt-lg" style="border-left:3px solid var(--amber-400);">
        <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8;">
          💡 <strong style="color:var(--amber-400);">Keutamaan Puasa Sunnah:</strong><br>
          • Puasa Senin-Kamis: amalan Rasulullah ﷺ yang rutin<br>
          • Puasa Ayyamul Bidh: seperti puasa setahun penuh<br>
          • Puasa Daud: puasa yang paling dicintai Allah
        </div>
      </div>
    `;
  }

  function renderDoa() {
    const doas = [
      { title: 'Doa Sebelum Tidur', arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', translation: 'Dengan nama-Mu ya Allah, aku mati dan aku hidup.' },
      { title: 'Doa Bangun Tidur', arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', translation: 'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan kepada-Nya kami dikembalikan.' },
      { title: 'Doa Sebelum Makan', arabic: 'بِسْمِ اللَّهِ وَبِبَرَكَةِ اللَّهِ', translation: 'Dengan nama Allah dan dengan berkah Allah.' },
      { title: 'Doa Keluar Rumah', arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', translation: 'Dengan nama Allah, aku bertawakal kepada Allah, tiada daya dan upaya kecuali dengan pertolongan Allah.' },
      { title: 'Doa Minta Keselamatan', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', translation: 'Ya Allah, sesungguhnya aku memohon keselamatan di dunia dan akhirat.' },
      { title: 'Istighfar', arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ', translation: 'Aku memohon ampun kepada Allah Yang Maha Agung, yang tiada Tuhan selain Dia, Yang Maha Hidup lagi Maha Berdiri Sendiri, dan aku bertaubat kepada-Nya.' },
    ];
    return doas.map(doa => `
      <div class="doa-card">
        <div class="doa-title">${doa.title}</div>
        <div class="doa-arabic">${doa.arabic}</div>
        <div class="doa-translation">${doa.translation}</div>
      </div>
    `).join('');
  }

  // --- Qibla Direction Calculation ---
  function calculateQiblaDirection(lat, lng) {
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;
    const phiK = (kaabaLat * Math.PI) / 180;
    const lambdaK = (kaabaLng * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;
    const lambda = (lng * Math.PI) / 180;
    const qibla = (180 / Math.PI) * Math.atan2(
      Math.sin(lambdaK - lambda),
      Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
    );
    return (qibla + 360) % 360;
  }

  async function loadPrayerTimes() {
    try {
      const settings = Storage.getSettings();
      const { latitude, longitude } = settings.location;
      const res = await fetch(`/api/prayer-times?latitude=${latitude}&longitude=${longitude}&method=${settings.prayerMethod}`);
      const result = await res.json();
      if (result.success) {
        prayerTimings = result.timings;
        if (result.date?.hijri) {
          const h = result.date.hijri;
          hijriDate = `${h.day} ${h.month.en} ${h.year}`;
        }
        if (activeTab === 'prayer') render();
        if (settings.prayerReminder) Notifications.schedulePrayerReminders(prayerTimings);
      }
    } catch (e) {
      console.error('Failed to load prayer times:', e);
    }
  }

  function attachEvents(container) {
    // Tab switching
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => { activeTab = tab.dataset.tab; render(); });
    });

    // Prayer checklist
    container.querySelectorAll('.prayer-item[data-prayer]').forEach(item => {
      item.addEventListener('click', () => {
        const prayer = item.dataset.prayer;
        const data = Storage.getDailyData();
        data.prayers[prayer] = !data.prayers[prayer];
        Storage.saveDailyData(data);
        const names = { fajr: 'Subuh', dhuhr: 'Dzuhur', asr: 'Ashar', maghrib: 'Maghrib', isha: 'Isya' };
        Notifications.showToast(data.prayers[prayer] ? `🕌 Alhamdulillah, sholat ${names[prayer]} tercatat!` : `Sholat ${names[prayer]} dibatalkan`, data.prayers[prayer] ? 'success' : 'info');
        const newAchievements = Storage.checkAchievements();
        newAchievements.forEach(id => { const def = Storage.getAchievementDef(id); if (def) Notifications.showToast(`🏆 Achievement: ${def.name}!`, 'success'); });
        render();
      });
    });

    // Quran toggle
    const quranToggle = document.getElementById('quran-toggle');
    if (quranToggle) {
      quranToggle.addEventListener('click', () => {
        const data = Storage.getDailyData();
        data.quran = !data.quran;
        Storage.saveDailyData(data);
        Notifications.showToast(data.quran ? '📖 MasyaAllah, tilawah hari ini tercatat!' : 'Tilawah dibatalkan', data.quran ? 'success' : 'info');
        render();
      });
    }

    // Dzikir
    const dzikirTap = document.getElementById('dzikir-tap');
    const dzikirCount = document.getElementById('dzikir-count');
    const dzikirReset = document.getElementById('dzikir-reset');

    if (dzikirTap) {
      dzikirTap.addEventListener('click', () => {
        const data = Storage.getDailyData();
        data.dzikir.count++;
        Storage.saveDailyData(data);
        if (dzikirCount) { dzikirCount.textContent = data.dzikir.count; dzikirCount.classList.add('pulse'); setTimeout(() => dzikirCount.classList.remove('pulse'), 300); }
        if (navigator.vibrate) navigator.vibrate(30);
        if (data.dzikir.count === 33) Notifications.showToast('📿 33× - Subhanallah selesai!', 'success');
        else if (data.dzikir.count === 66) Notifications.showToast('📿 66× - Alhamdulillah selesai!', 'success');
        else if (data.dzikir.count === 99) Notifications.showToast('📿 99× - Allahu Akbar selesai! MasyaAllah! 🎉', 'success');
        Storage.checkAchievements().forEach(id => { const def = Storage.getAchievementDef(id); if (def) Notifications.showToast(`🏆 Achievement: ${def.name}!`, 'success'); });
      });
    }

    if (dzikirReset) {
      dzikirReset.addEventListener('click', () => {
        const data = Storage.getDailyData();
        data.dzikir.count = 0;
        Storage.saveDailyData(data);
        if (dzikirCount) dzikirCount.textContent = '0';
        Notifications.showToast('Dzikir counter direset', 'info');
      });
    }

    const setTargetBtn = document.getElementById('dzikir-set-target');
    if (setTargetBtn) {
      setTargetBtn.addEventListener('click', () => {
        const data = Storage.getDailyData();
        const targets = [33, 99, 100, 1000];
        const currentIdx = targets.indexOf(data.dzikir.target);
        data.dzikir.target = targets[(currentIdx + 1) % targets.length];
        Storage.saveDailyData(data);
        setTargetBtn.textContent = `Target: ${data.dzikir.target}`;
      });
    }

    // Kiblat compass
    const compassBtn = document.getElementById('btn-start-compass');
    if (compassBtn) {
      compassBtn.addEventListener('click', startCompass);
    }

    // Fasting
    container.querySelectorAll('.fasting-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const data = Storage.getDailyData();
        data.fasting = { active: true, type: btn.dataset.name };
        Storage.saveDailyData(data);
        Notifications.showToast(`🌙 Puasa ${btn.dataset.name} dimulai! Semoga Allah menerima.`, 'success');
        Storage.checkAchievements().forEach(id => { const def = Storage.getAchievementDef(id); if (def) Notifications.showToast(`🏆 Achievement: ${def.name}!`, 'success'); });
        render();
      });
    });

    const breakFastBtn = document.getElementById('btn-break-fast');
    if (breakFastBtn) {
      breakFastBtn.addEventListener('click', () => {
        const data = Storage.getDailyData();
        data.fasting = { active: false, type: '' };
        Storage.saveDailyData(data);
        Notifications.showToast('🍽️ Alhamdulillah, semoga puasa diterima!', 'success');
        render();
      });
    }
  }

  function startCompass() {
    if (!window.DeviceOrientationEvent) {
      Notifications.showToast('Kompas tidak didukung di perangkat ini', 'warning');
      return;
    }

    // iOS requires permission
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => { if (response === 'granted') listenCompass(); else Notifications.showToast('Izin kompas ditolak', 'warning'); })
        .catch(() => Notifications.showToast('Gagal meminta izin kompas', 'error'));
    } else {
      listenCompass();
    }
  }

  function listenCompass() {
    const settings = Storage.getSettings();
    const qiblaAngle = calculateQiblaDirection(settings.location.latitude, settings.location.longitude);

    Notifications.showToast('🧭 Kompas aktif! Putar HP kamu.', 'success');

    window.addEventListener('deviceorientation', (e) => {
      let heading = e.alpha;
      if (e.webkitCompassHeading) heading = e.webkitCompassHeading;
      if (heading === null || heading === undefined) return;

      const arrow = document.getElementById('compass-arrow');
      const dirEl = document.querySelector('.compass-direction');
      if (arrow) {
        const rotation = qiblaAngle - heading;
        arrow.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
      }
      if (dirEl) dirEl.textContent = `Kiblat: ${Math.round(qiblaAngle)}° | Heading: ${Math.round(heading)}°`;
    }, true);
  }

  return { render, loadPrayerTimes };
})();
