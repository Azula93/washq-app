/**
 * WashQ / KodiQuett — Inicializador Principal y Enrutador
 * Conecta los eventos del sistema, teclado (F2), navegación entre vistas y PWA.
 */

    function setupEventListeners() {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
          e.preventDefault();
          openNewOrderModal();
        }
        if (e.key === 'Escape') {
          closeAllModals();
        }
      });

      const plateInput = document.getElementById('orderPlateInput');
      if (plateInput) {
        plateInput.addEventListener('input', (e) => {
          let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
          let formatted = raw;
          if (raw.length > 3) {
            formatted = raw.slice(0, 3) + '-' + raw.slice(3, 6);
          }
          e.target.value = formatted;

          const badge = document.getElementById('orderPlateDetectedBadge');

          // Si la sede actual es exclusiva de motos, siempre permanece en moto
          if (typeof isSedeSoloMotos === 'function' && isSedeSoloMotos()) {
            if (appState.selectedVehicleType !== 'moto') {
              selectVehicleType('moto');
            }
            if (badge) {
              badge.textContent = 'Exclusivo Motos';
              badge.style.display = 'inline-block';
              badge.style.background = '#FEF3C7';
              badge.style.color = '#D97706';
            }
            return;
          }

          // Auto-detección por formato de placa en Colombia:
          // Placa de Moto: 3 letras + 2 números + 1 letra (ej: ABC-12D, KTF-89F, WXQ-45E).
          // En Colombia ningún carro particular ni público termina en letra.
          // Por tanto, si tiene 5 o más caracteres, contiene números y el último caracter es una letra: es 100% MOTO.
          const isMotoPlate = raw.length >= 5 && /[0-9]+[A-Z]$/.test(raw);
          const isCarPlate = raw.length === 6 && /^[A-Z]{3}[0-9]{3}$/.test(raw);

          if (isMotoPlate) {
            if (badge) {
              badge.textContent = 'Moto detectada';
              badge.style.display = 'inline-block';
              badge.style.background = '#FEF3C7';
              badge.style.color = '#D97706';
            }
            if (appState.selectedVehicleType !== 'moto') {
              selectVehicleType('moto');
              if (typeof showToast === 'function') {
                showToast('Tipo detectado: Moto', 'info', 1400);
              }
            }
          } else if (isCarPlate) {
            if (badge) {
              badge.textContent = 'Carro detectado';
              badge.style.display = 'inline-block';
              badge.style.background = '#EFF6FF';
              badge.style.color = '#2563EB';
            }
            if (appState.selectedVehicleType === 'moto') {
              selectVehicleType('carro');
              if (typeof showToast === 'function') {
                showToast('Tipo detectado: Carro', 'info', 1400);
              }
            }
          } else {
            if (badge && raw.length < 5) {
              badge.style.display = 'none';
            }
          }
        });
      }
    }

    function switchView(viewId) {
      document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.mob-nav-btn').forEach(el => el.classList.remove('active'));

      const targetView = document.getElementById('view-' + viewId);
      const targetNav = document.getElementById('nav-' + viewId);
      const targetMobNav = document.getElementById('mob-nav-' + viewId);

      if (targetView) targetView.classList.add('active');
      if (targetNav) targetNav.classList.add('active');
      if (targetMobNav) targetMobNav.classList.add('active');

      const isOperario = appState.currentRole === 'operario' || appState.currentRole === 'lavador';
      const headings = {
        'overview': 'Resumen General',
        'patio': 'Zona de Lavado',
        'caja': 'Cuadre de Caja',
        'comisiones': isOperario ? 'Mis Ganancias del Día' : 'Liquidación de Operarios',
        'historial': 'Historial de Vehículos',
        'config': 'Configuración y Parámetros'
      };
      const headingEl = document.getElementById('viewMainHeading');
      if (headingEl) headingEl.textContent = headings[viewId] || 'WashQ';
      renderAllViews();
    }

    function renderAllViews() {
      renderOverview();
      renderKanban();
      renderCaja();
      renderWashers();
      renderHistory();
      renderServicesConfig();
      renderBusinessConfig();
      renderPaymentMethodsConfig();
      renderExpenseCategoriesConfig();
    }


    // ================= SOPORTE PWA (INSTALACIÓN & SERVICE WORKER) =================
    let deferredPwaPrompt = null;

    function initPwaInstallPrompt() {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;
        const installBtn = document.getElementById('btnPwaInstall');
        if (installBtn) installBtn.style.display = 'inline-flex';
      });

      window.addEventListener('appinstalled', () => {
        console.log('WashQ PWA instalada exitosamente en el sistema');
        deferredPwaPrompt = null;
        const installBtn = document.getElementById('btnPwaInstall');
        if (installBtn) installBtn.style.display = 'none';
      });
    }

    function installPWA() {
      if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        deferredPwaPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('El usuario aceptó instalar WashQ');
          }
          deferredPwaPrompt = null;
          const installBtn = document.getElementById('btnPwaInstall');
          if (installBtn) installBtn.style.display = 'none';
        });
      } else {
        alert('Para instalar WashQ en tu dispositivo:\n\n• En Android / Chrome: Toca el menú (3 puntos) y presiona "Instalar aplicación" o "Añadir a pantalla de inicio".\n• En iPhone / Safari: Toca el botón Compartir y presiona "Añadir a la pantalla de inicio".\n• En PC / Windows: Toca el icono de instalación en la barra de direcciones del navegador.');
      }
    }

    function registerPwaServiceWorker() {
      const isLocalHost = Boolean(
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '[::1]' ||
        window.location.protocol === 'file:'
      );

      if (isLocalHost) {
        console.log('🛠️ [WashQ Dev] Modo Local detectado: Service Worker desactivado para reflejar cambios en tiempo real sin caché.');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(r => r.unregister());
          });
        }
        if ('caches' in window) {
          caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
        }
        return;
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js?v=5.1.0')
          .then((reg) => {
            console.log('[WashQ PWA] Service Worker registrado en alcance:', reg.scope);
            reg.update();
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🚀 [WashQ] Nueva versión instalada. Recargando para activar v5.0.0...');
                    window.location.reload();
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.log('Aviso: Service Worker no activo (común en modo file:// local):', err);
          });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      }
    }

    function forcePwaCacheRefresh() {
      if (!confirm('¿Deseas forzar la actualización de WashQ y limpiar la caché offline? Esto descargará la última versión oficial v5.0.0.')) return;
      if ('caches' in window) {
        caches.keys().then(function(names) {
          return Promise.all(names.map(name => caches.delete(name)));
        }).then(function() {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              return Promise.all(registrations.map(r => r.unregister()));
            }).then(function() {
              window.location.href = window.location.pathname + '?v=' + Date.now();
            });
          } else {
            window.location.href = window.location.pathname + '?v=' + Date.now();
          }
        }).catch(function() {
          window.location.href = window.location.pathname + '?v=' + Date.now();
        });
      } else {
        window.location.href = window.location.pathname + '?v=' + Date.now();
      }
    }

// Inicialización de la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuthRouteOrSession();
  initPwaInstallPrompt();
  registerPwaServiceWorker();

  // Actualizador de cronómetros en patio cada 15 segundos
  setInterval(() => {
    updateKanbanTimers();
  }, 15000);
});
