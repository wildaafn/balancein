/**
 * BalanceIn — Onboarding Flow
 * Welcome screens with step-by-step setup for new users.
 */

const Onboarding = (() => {
  let currentStep = 0;

  const steps = [
    {
      icon: '☯',
      title: 'Selamat Datang di BalanceIn',
      desc: 'Aplikasi yang membantu kamu menjaga keseimbangan hidup antara tubuh, pikiran, dan hati.',
      visual: 'logo',
    },
    {
      icon: '💪',
      title: 'Jaga Kesehatan Fisik',
      desc: 'Pantau asupan air, olahraga, tidur, dan pola makan harianmu. Tubuh sehat, hidup lebih produktif!',
      visual: 'health',
      color: 'var(--emerald-400)',
    },
    {
      icon: '🧠',
      title: 'Rawat Kesehatan Mental',
      desc: 'Check-in mood, latihan pernapasan, dan jurnal syukur. Pikiran tenang, hati tentram.',
      visual: 'mental',
      color: 'var(--indigo-400)',
    },
    {
      icon: '🕌',
      title: 'Tingkatkan Ibadah',
      desc: 'Jadwal sholat otomatis, dzikir counter, tilawah Al-Quran, dan puasa sunnah. Dekat dengan Allah.',
      visual: 'spiritual',
      color: 'var(--amber-400)',
    },
    {
      icon: '🤖',
      title: 'AI Coach Siap Membantu',
      desc: 'Tanya apa saja ke AI Coach yang memahami konteks kesehatan, mental, dan ibadah Islam kamu.',
      visual: 'ai',
      color: 'var(--emerald-400)',
    },
    {
      icon: '📍',
      title: 'Atur Lokasi Kamu',
      desc: 'Untuk jadwal sholat yang akurat, izinkan BalanceIn mendeteksi lokasimu atau pilih kota manual.',
      visual: 'location',
      action: true,
    },
  ];

  function show() {
    if (Storage.isOnboarded()) return false;

    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.className = 'onboarding-overlay';
    overlay.innerHTML = renderStep(0);
    document.body.appendChild(overlay);

    attachEvents();
    return true;
  }

  function renderStep(idx) {
    const step = steps[idx];
    const isLast = idx === steps.length - 1;

    return `
      <div class="onboarding-card" key="${idx}">
        <div class="onboarding-visual onboarding-visual-${step.visual || 'default'}">
          <span class="onboarding-icon" style="${step.color ? `color:${step.color}` : ''}">${step.icon}</span>
        </div>
        <h2 class="onboarding-title">${step.title}</h2>
        <p class="onboarding-desc">${step.desc}</p>
        
        ${step.action ? `
          <div class="onboarding-actions">
            <button class="btn btn-primary" id="onboarding-detect-location" style="width:100%;">
              📍 Deteksi Lokasi Otomatis
            </button>
            <button class="btn btn-secondary mt-md" id="onboarding-skip-location" style="width:100%;">
              Nanti Saja (Default: Jakarta)
            </button>
          </div>
        ` : ''}

        <div class="onboarding-dots">
          ${steps.map((_, i) => `<span class="onboarding-dot ${i === idx ? 'active' : ''}" data-step="${i}"></span>`).join('')}
        </div>

        <div class="onboarding-nav">
          ${idx > 0 ? `<button class="btn btn-secondary" id="onboarding-prev">← Kembali</button>` : '<div></div>'}
          ${!step.action ? `
            <button class="btn btn-primary" id="onboarding-next">
              ${isLast ? 'Mulai! 🚀' : 'Lanjut →'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  function attachEvents() {
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;

    overlay.addEventListener('click', (e) => {
      const target = e.target;

      if (target.id === 'onboarding-next') {
        if (currentStep < steps.length - 1) {
          currentStep++;
          overlay.innerHTML = renderStep(currentStep);
          attachEvents();
        } else {
          finish();
        }
      } else if (target.id === 'onboarding-prev') {
        if (currentStep > 0) {
          currentStep--;
          overlay.innerHTML = renderStep(currentStep);
          attachEvents();
        }
      } else if (target.id === 'onboarding-detect-location') {
        detectLocationOnboarding(overlay);
      } else if (target.id === 'onboarding-skip-location') {
        finish();
      } else if (target.classList.contains('onboarding-dot')) {
        currentStep = parseInt(target.dataset.step);
        overlay.innerHTML = renderStep(currentStep);
        attachEvents();
      }
    });
  }

  async function detectLocationOnboarding(overlay) {
    const btn = document.getElementById('onboarding-detect-location');
    if (btn) {
      btn.textContent = '📍 Mendeteksi...';
      btn.disabled = true;
    }

    if (!navigator.geolocation) {
      finish();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let city = 'Lokasi Terdeteksi';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`);
          const data = await res.json();
          city = data.address?.city || data.address?.town || data.address?.county || city;
        } catch (e) { /* ignore */ }

        Storage.updateSetting('location', { latitude, longitude, city });
        Notifications.showToast(`📍 Lokasi: ${city}`, 'success');
        finish();
      },
      () => finish(),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function finish() {
    Storage.setOnboarded();
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
      overlay.style.animation = 'fadeOut 0.4s ease-out forwards';
      setTimeout(() => overlay.remove(), 400);
    }
    currentStep = 0;

    // Request notification permission after onboarding
    setTimeout(() => {
      Notifications.requestPermission();
    }, 2000);
  }

  return { show };
})();
