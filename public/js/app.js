/**
 * BalanceIn — Main Application
 * SPA Router, Service Worker registration, PWA install prompt.
 */

const App = (() => {
  let currentView = 'dashboard';
  let deferredInstallPrompt = null;

  // View registry
  const views = {
    dashboard: { module: Dashboard, title: 'Beranda' },
    health: { module: Health, title: 'Kesehatan' },
    spiritual: { module: Spiritual, title: 'Ibadah' },
    breathing: { module: Breathing, title: 'Pernapasan' },
    ai: { module: AICoach, title: 'AI Coach' },
    settings: { module: Settings, title: 'Pengaturan' },
  };

  function init() {
    // 1. Initialize notifications
    Notifications.init();

    // 2. Register service worker
    registerServiceWorker();

    // 3. Setup navigation
    setupNavigation();

    // 4. Handle PWA install prompt
    handleInstallPrompt();

    // 5. Handle notification button
    setupNotificationButton();

    // 6. Schedule water reminder
    Notifications.scheduleWaterReminder();

    // 7. Render initial view
    const hash = window.location.hash.replace('#', '');
    if (hash && views[hash]) {
      navigateTo(hash);
    } else {
      renderCurrentView();
    }

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && views[hash] && hash !== currentView) {
        navigateTo(hash);
      }
    });

    // 8. Handle Splash Screen & Onboarding
    handleBootSequence();

    console.log('🌟 BalanceIn initialized');
  }

  function handleBootSequence() {
    const splash = document.getElementById('splash-screen');
    
    // Simulate loading time for splash screen (1.8s)
    setTimeout(() => {
      if (splash) {
        splash.classList.add('fade-out');
        setTimeout(() => splash.remove(), 600); // Wait for transition
      }

      // Check onboarding after splash
      if (!Storage.isOnboarded()) {
        setTimeout(() => {
          Onboarding.show();
        }, 300);
      } else {
        // Daily login achievement check
        Storage.checkAchievements().forEach(id => {
          const def = Storage.getAchievementDef(id);
          if (def) Notifications.showToast(`🏆 Achievement: ${def.name}!`, 'success');
        });
      }
    }, 1800);
  }

  function navigateTo(viewName) {
    if (!views[viewName]) return;

    // Stop breathing exercise if navigating away
    if (currentView === 'breathing' && viewName !== 'breathing') {
      Breathing.stop();
    }

    currentView = viewName;
    window.location.hash = viewName;

    // Update nav (exclude breathing from bottom nav)
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Show/hide views
    document.querySelectorAll('.view').forEach((view) => {
      view.classList.remove('active');
    });

    const viewEl = document.getElementById(`view-${viewName}`);
    if (viewEl) {
      viewEl.classList.add('active');
    }

    // Render
    renderCurrentView();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function renderCurrentView() {
    const view = views[currentView];
    if (view && view.module && view.module.render) {
      view.module.render();
    }
  }

  function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        navigateTo(view);
      });
    });
  }

  // --- Service Worker ---
  async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              Notifications.showToast('🔄 Aplikasi diperbarui! Refresh untuk versi terbaru.', 'info');
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // --- PWA Install ---
  function handleInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      hideInstallBanner();
      Notifications.showToast('🎉 BalanceIn berhasil di-install!', 'success');
    });
  }

  function showInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('hidden');

    const installBtn = document.getElementById('btn-install');
    const closeBtn = document.getElementById('btn-install-close');

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          const { outcome } = await deferredInstallPrompt.userChoice;
          if (outcome === 'accepted') {
            console.log('PWA installed');
          }
          deferredInstallPrompt = null;
          hideInstallBanner();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => hideInstallBanner());
    }
  }

  function hideInstallBanner() {
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.add('hidden');
  }

  // --- Notification Button ---
  function setupNotificationButton() {
    const btn = document.getElementById('btn-notifications');
    if (btn) {
      btn.addEventListener('click', async () => {
        const granted = await Notifications.requestPermission();
        if (granted) {
          Notifications.scheduleWaterReminder();
        }
      });
    }
  }

  return { init, navigateTo };
})();

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
