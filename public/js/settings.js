/**
 * BalanceIn — Settings View
 * Location, targets, notification preferences, and data management.
 */

const Settings = (() => {
  function render() {
    const container = document.getElementById('view-settings');
    const settings = Storage.getSettings();
    const notifPermission = Notifications.getPermission();

    container.innerHTML = `
      <div class="section-title">
        <span class="emoji">⚙️</span> Pengaturan
      </div>

      <!-- Profil -->
      <div class="settings-group">
        <div class="settings-group-title">👤 Profil</div>
        <div class="settings-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <div style="display:flex; align-items:center; gap: 12px; width: 100%;">
            <div class="settings-icon">👋</div>
            <div class="settings-info" style="flex:1;">
              <div class="settings-label">Nama Panggilan</div>
              <div class="settings-desc">Biar aplikasi lebih personal buat kamu</div>
            </div>
          </div>
          <div style="display:flex; gap: 8px; width: 100%; margin-top: 8px;">
            <input type="text" id="input-username" class="input-field" placeholder="Masukkan nama..." value="${settings.userName || ''}" style="flex:1;">
            <button class="btn btn-primary" id="btn-save-username" style="padding:0 16px;">Simpan</button>
          </div>
        </div>
      </div>

      <!-- Location -->
      <div class="settings-group">
        <div class="settings-group-title">📍 Lokasi</div>
        <div class="settings-item" id="setting-location">
          <div class="settings-icon">🕌</div>
          <div class="settings-info">
            <div class="settings-label">Lokasi Jadwal Sholat</div>
            <div class="settings-desc">${settings.location.city || 'Belum diatur'}</div>
          </div>
          <button class="btn btn-secondary" id="btn-detect-location" style="padding:8px 12px;font-size:0.75rem;">
            📍 Deteksi
          </button>
        </div>
        <div class="settings-item">
          <div class="settings-icon">🧭</div>
          <div class="settings-info">
            <div class="settings-label">Metode Perhitungan</div>
            <div class="settings-desc">Kemenag RI (Method ${settings.prayerMethod})</div>
          </div>
        </div>
      </div>

      <!-- Targets -->
      <div class="settings-group">
        <div class="settings-group-title">🎯 Target Harian</div>
        <div class="settings-item">
          <div class="settings-icon">💧</div>
          <div class="settings-info">
            <div class="settings-label">Target Air</div>
            <div class="settings-desc">${settings.waterTarget} gelas per hari</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="btn btn-secondary" data-target="waterTarget" data-dir="-1" style="padding:4px 12px;font-size:1rem;">−</button>
            <span style="font-family:var(--font-heading);font-weight:700;min-width:24px;text-align:center;">${settings.waterTarget}</span>
            <button class="btn btn-secondary" data-target="waterTarget" data-dir="1" style="padding:4px 12px;font-size:1rem;">+</button>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-icon">🏃</div>
          <div class="settings-info">
            <div class="settings-label">Target Olahraga</div>
            <div class="settings-desc">${settings.exerciseTarget} menit per hari</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="btn btn-secondary" data-target="exerciseTarget" data-dir="-10" style="padding:4px 12px;font-size:1rem;">−</button>
            <span style="font-family:var(--font-heading);font-weight:700;min-width:32px;text-align:center;">${settings.exerciseTarget}</span>
            <button class="btn btn-secondary" data-target="exerciseTarget" data-dir="10" style="padding:4px 12px;font-size:1rem;">+</button>
          </div>
        </div>
        <div class="settings-item">
          <div class="settings-icon">😴</div>
          <div class="settings-info">
            <div class="settings-label">Target Tidur</div>
            <div class="settings-desc">${settings.sleepTarget} jam per malam</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="btn btn-secondary" data-target="sleepTarget" data-dir="-1" style="padding:4px 12px;font-size:1rem;">−</button>
            <span style="font-family:var(--font-heading);font-weight:700;min-width:24px;text-align:center;">${settings.sleepTarget}</span>
            <button class="btn btn-secondary" data-target="sleepTarget" data-dir="1" style="padding:4px 12px;font-size:1rem;">+</button>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="settings-group">
        <div class="settings-group-title">🔔 Notifikasi</div>
        <div class="settings-item">
          <div class="settings-icon">🔔</div>
          <div class="settings-info">
            <div class="settings-label">Notifikasi Browser</div>
            <div class="settings-desc">${notifPermission === 'granted' ? '✅ Aktif' : notifPermission === 'denied' ? '❌ Diblokir' : '⏸️ Belum diizinkan'}</div>
          </div>
          ${
            notifPermission !== 'granted'
              ? `<button class="btn btn-primary" id="btn-enable-notif" style="padding:8px 12px;font-size:0.75rem;">Aktifkan</button>`
              : ''
          }
        </div>
        <div class="settings-item">
          <div class="settings-icon">🕌</div>
          <div class="settings-info">
            <div class="settings-label">Reminder Sholat</div>
            <div class="settings-desc">Notifikasi 5 menit sebelum waktu sholat</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="toggle-prayer-reminder" ${settings.prayerReminder ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="settings-item">
          <div class="settings-icon">💧</div>
          <div class="settings-info">
            <div class="settings-label">Reminder Minum Air</div>
            <div class="settings-desc">Ingatkan setiap 2 jam</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="toggle-water-reminder" ${settings.waterReminder ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- Achievements -->
      <div class="settings-group">
        <div class="settings-group-title">🏆 Pencapaian (Achievements)</div>
        <div class="achievements-grid">
          ${Storage.ACHIEVEMENT_DEFS.map(def => {
            const unlocked = Storage.getAchievements().includes(def.id);
            return `
              <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                ${!unlocked ? '<span class="achievement-locked-icon">🔒</span>' : ''}
                <span class="achievement-icon">${def.icon}</span>
                <div class="achievement-name">${def.name}</div>
                <div class="achievement-desc">${def.desc}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Data -->
      <div class="settings-group">
        <div class="settings-group-title">💾 Data</div>
        <div class="settings-item" id="setting-export" style="cursor:pointer;">
          <div class="settings-icon">📤</div>
          <div class="settings-info">
            <div class="settings-label">Backup Data (Export)</div>
            <div class="settings-desc">Simpan backup data ke file JSON</div>
          </div>
        </div>
        <div class="settings-item" id="setting-import" style="cursor:pointer; position:relative;">
          <div class="settings-icon">📥</div>
          <div class="settings-info">
            <div class="settings-label">Pulihkan Data (Import)</div>
            <div class="settings-desc">Pulihkan data dari file JSON</div>
          </div>
          <input type="file" id="import-file" accept=".json" style="position:absolute; inset:0; opacity:0; cursor:pointer; width:100%;">
        </div>
        <div class="settings-item" id="setting-clear-chat" style="cursor:pointer;">
          <div class="settings-icon">🗑️</div>
          <div class="settings-info">
            <div class="settings-label">Hapus Riwayat Chat</div>
            <div class="settings-desc">Hapus semua percakapan dengan AI Coach</div>
          </div>
        </div>
        <div class="settings-item" id="setting-reset-all" style="cursor:pointer;">
          <div class="settings-icon" style="background:rgba(244,63,94,0.15);">⚠️</div>
          <div class="settings-info">
            <div class="settings-label" style="color:var(--rose-400);">Reset Semua Data</div>
            <div class="settings-desc">Hapus semua data tracking dan pengaturan</div>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="settings-group">
        <div class="settings-group-title">ℹ️ Tentang</div>
        <div class="card" style="text-align:center;">
          <div style="margin-bottom:8px;"><img src="/icons/icon-192.png" style="width:48px; height:48px; object-fit:contain;" alt="Logo"></div>
          <div style="font-family:var(--font-heading);font-weight:700;font-size:1.2rem;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">BalanceIn</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;">v1.0.0 — Life Balance Reminder</div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:8px;">
            Dibuat untuk Juara VibeCoding Google 🚀<br>
            <strong>vibecode by WildaAfn</strong><br>
            Powered by Gemini AI & AlAdhan API
          </div>
        </div>
      </div>
    `;

    attachEvents(container);
  }

  function attachEvents(container) {
    // Save username
    const saveNameBtn = document.getElementById('btn-save-username');
    const nameInput = document.getElementById('input-username');
    if (saveNameBtn && nameInput) {
      saveNameBtn.addEventListener('click', () => {
        const newName = nameInput.value.trim();
        Storage.updateSetting('userName', newName);
        Notifications.showToast('Nama berhasil disimpan! ✨', 'success');
        
        // Update greeting in dashboard if we are there (though we are in settings now)
        // Re-render settings just to be clean
        render();
      });
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveNameBtn.click();
      });
    }

    // Detect location
    const detectBtn = document.getElementById('btn-detect-location');
    if (detectBtn) {
      detectBtn.addEventListener('click', detectLocation);
    }

    // Target adjustments
    container.querySelectorAll('[data-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const dir = parseInt(btn.dataset.dir);
        const settings = Storage.getSettings();
        const mins = { waterTarget: 1, exerciseTarget: 10, sleepTarget: 4 };
        const maxs = { waterTarget: 16, exerciseTarget: 120, sleepTarget: 12 };
        const newVal = settings[target] + dir;
        if (newVal >= mins[target] && newVal <= maxs[target]) {
          Storage.updateSetting(target, newVal);
          render();
        }
      });
    });

    // Enable notifications
    const enableNotifBtn = document.getElementById('btn-enable-notif');
    if (enableNotifBtn) {
      enableNotifBtn.addEventListener('click', async () => {
        await Notifications.requestPermission();
        render();
      });
    }

    // Toggle prayer reminder
    const prayerToggle = document.getElementById('toggle-prayer-reminder');
    if (prayerToggle) {
      prayerToggle.addEventListener('change', () => {
        Storage.updateSetting('prayerReminder', prayerToggle.checked);
        Notifications.showToast(
          prayerToggle.checked ? 'Reminder sholat diaktifkan 🕌' : 'Reminder sholat dinonaktifkan',
          prayerToggle.checked ? 'success' : 'info'
        );
      });
    }

    // Toggle water reminder
    const waterToggle = document.getElementById('toggle-water-reminder');
    if (waterToggle) {
      waterToggle.addEventListener('change', () => {
        Storage.updateSetting('waterReminder', waterToggle.checked);
        Notifications.showToast(
          waterToggle.checked ? 'Reminder minum air diaktifkan 💧' : 'Reminder minum air dinonaktifkan',
          waterToggle.checked ? 'success' : 'info'
        );
        if (waterToggle.checked) Notifications.scheduleWaterReminder();
      });
    }

    // Export
    const exportBtn = document.getElementById('setting-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const dataStr = Storage.exportData();
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `balancein-backup-${Storage.getTodayKey()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        Notifications.showToast('Data berhasil diekspor!', 'success');
      });
    }

    // Import
    const importFile = document.getElementById('import-file');
    if (importFile) {
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
          const success = Storage.importData(event.target.result);
          if (success) {
            Notifications.showToast('Data berhasil dipulihkan! Memuat ulang...', 'success');
            setTimeout(() => location.reload(), 1500);
          } else {
            Notifications.showToast('Gagal memulihkan data. Format tidak valid.', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Clear chat
    const clearChat = document.getElementById('setting-clear-chat');
    if (clearChat) {
      clearChat.addEventListener('click', () => {
        if (confirm('Hapus semua riwayat chat dengan AI Coach?')) {
          Storage.clearChatHistory();
          Notifications.showToast('Riwayat chat dihapus', 'success');
        }
      });
    }

    // Reset all
    const resetAll = document.getElementById('setting-reset-all');
    if (resetAll) {
      resetAll.addEventListener('click', () => {
        if (confirm('⚠️ Yakin ingin menghapus SEMUA data? Tindakan ini tidak bisa dibatalkan.')) {
          Storage.resetAllData();
          Notifications.showToast('Semua data telah direset', 'warning');
          setTimeout(() => location.reload(), 1000);
        }
      });
    }
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      Notifications.showToast('Geolocation tidak didukung browser ini', 'warning');
      return;
    }

    Notifications.showToast('📍 Mendeteksi lokasi...', 'info');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Try to get city name via reverse geocoding (simple approach)
        let city = 'Lokasi Terdeteksi';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`);
          const data = await res.json();
          city = data.address?.city || data.address?.town || data.address?.county || city;
        } catch (e) {
          console.error('Geocoding error:', e);
        }

        Storage.updateSetting('location', { latitude, longitude, city });
        Notifications.showToast(`📍 Lokasi diperbarui: ${city}`, 'success');

        // Reload prayer times
        Spiritual.loadPrayerTimes();
        render();
      },
      (err) => {
        console.error('Geolocation error:', err);
        Notifications.showToast('Gagal mendeteksi lokasi. Periksa izin lokasi browser.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return { render };
})();
