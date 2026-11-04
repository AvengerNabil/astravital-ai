/**
 * AstraVital AI - Progressive Web App (PWA) Controller
 * Service Worker Registration, Install Prompts, & Offline Spaceflight Sync
 */

(function () {
  'use strict';

  let deferredInstallPrompt = null;

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[AstraVital PWA] Service Worker active with scope:', reg.scope);

          // Check for background updates
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.onstatechange = () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[AstraVital PWA] New update ready. Reload to apply.');
              }
            };
          };
        })
        .catch((err) => {
          console.warn('[AstraVital PWA] Service Worker registration failed:', err);
        });
    });
  }

  // 2. Intercept Native BeforeInstallPrompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log('[AstraVital PWA] Install prompt captured');

    // Reveal Install buttons in Header & Slide Drawer
    const installBtns = document.querySelectorAll('.btn-pwa-install');
    installBtns.forEach((btn) => {
      btn.style.display = 'inline-flex';
    });
  });

  // 3. User Triggers Install Prompt
  window.installAstraVitalPWA = async function () {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      console.log('[AstraVital PWA] User install choice:', choice.outcome);
      if (choice.outcome === 'accepted') {
        const installBtns = document.querySelectorAll('.btn-pwa-install');
        installBtns.forEach((btn) => (btn.style.display = 'none'));
      }
      deferredInstallPrompt = null;
    } else {
      // Manual instructions fallback
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        alert('To install AstraVital AI on iOS:\n1. Tap the Share icon (⎙ / [↑]) at the bottom of Safari.\n2. Select "Add to Home Screen".');
      } else {
        alert('To install AstraVital AI:\n1. Tap the browser menu (⋮) at top right.\n2. Select "Install app" or "Add to Home Screen".');
      }
    }
  };

  // 4. Handle Successful App Installation
  window.addEventListener('appinstalled', () => {
    console.log('[AstraVital PWA] Application successfully installed to home screen!');
    deferredInstallPrompt = null;
    const installBtns = document.querySelectorAll('.btn-pwa-install');
    installBtns.forEach((btn) => (btn.style.display = 'none'));
    
    if (window.AudioSynthesizer) {
      window.AudioSynthesizer.playSuccess();
    }
  });

  // 5. Offline / Online Connectivity Notification Banner
  function showConnectionToast(isOnline) {
    let toast = document.getElementById('pwa-offline-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pwa-offline-toast';
      toast.className = 'pwa-offline-toast font-mono';
      document.body.appendChild(toast);
    }

    if (!isOnline) {
      toast.innerHTML = '<span>📡</span> <span>AUTONOMOUS OFFLINE MODE • Local Telemetry Active</span>';
      toast.className = 'pwa-offline-toast font-mono offline visible';
    } else {
      toast.innerHTML = '<span>🌐</span> <span>DEEP SPACE NETWORK RECONNECTED</span>';
      toast.className = 'pwa-offline-toast font-mono online visible';
      setTimeout(() => {
        toast.classList.remove('visible');
      }, 4000);
    }
  }

  window.addEventListener('offline', () => showConnectionToast(false));
  window.addEventListener('online', () => showConnectionToast(true));

  // Initialize click handlers on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    const installBtns = document.querySelectorAll('.btn-pwa-install');
    installBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.installAstraVitalPWA();
      });
    });

    // Check if launched as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      document.body.classList.add('pwa-standalone');
      console.log('[AstraVital PWA] Running in Standalone Display Mode');
    }
  });
})();

