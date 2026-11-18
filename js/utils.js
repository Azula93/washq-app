/**
 * WashQ / KodiQuett — Funciones Utilitarias y Helpers
 * Formatos de moneda COP, cálculo de fechas, marcas de pago y notificaciones UI.
 */

    function formatCOP(num) {
      return '$ ' + Number(num || 0).toLocaleString('es-CO');
    }

    // Inicialización

    // SISTEMA UNIFICADO DE NOTIFICACIONES (TOASTS) Y MODAL DE CONFIRMACIÓN
    // ==========================================================================
    let confirmDialogResolver = null;

    function showConfirmDialog({
      title = '¿Confirmar acción?',
      message = '¿Estás seguro de continuar?',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      type = 'danger' // 'danger' | 'warning' | 'primary' | 'success'
    } = {}) {
      return new Promise((resolve) => {
        confirmDialogResolver = resolve;

        const modal = document.getElementById('modalConfirmDialog');
        const titleEl = document.getElementById('confirmDialogTitle');
        const msgEl = document.getElementById('confirmDialogMessage');
        const actionBtn = document.getElementById('confirmDialogActionBtn');
        const cancelBtn = document.getElementById('confirmDialogCancelBtn');
        const iconBox = document.getElementById('confirmDialogIconBox');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;

        if (actionBtn) {
          actionBtn.textContent = confirmText;
          if (type === 'danger') {
            actionBtn.style.background = '#DC2626';
            actionBtn.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.28)';
          } else if (type === 'primary') {
            actionBtn.style.background = 'var(--accent-primary)';
            actionBtn.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.28)';
          } else if (type === 'warning') {
            actionBtn.style.background = '#D97706';
            actionBtn.style.boxShadow = '0 4px 12px rgba(217, 119, 6, 0.28)';
          } else {
            actionBtn.style.background = '#059669';
            actionBtn.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.28)';
          }
        }

        if (cancelBtn) cancelBtn.textContent = cancelText;

        if (iconBox) {
          if (type === 'danger') {
            iconBox.style.background = '#FEF2F2';
            iconBox.style.color = '#DC2626';
            iconBox.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>';
          } else if (type === 'warning') {
            iconBox.style.background = '#FFFBEB';
            iconBox.style.color = '#D97706';
            iconBox.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
          } else if (type === 'primary') {
            iconBox.style.background = 'var(--accent-subtle)';
            iconBox.style.color = 'var(--accent-primary)';
            iconBox.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>';
          } else {
            iconBox.style.background = '#ECFDF5';
            iconBox.style.color = '#059669';
            iconBox.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          }
        }

        if (modal) modal.classList.add('active');
      });
    }

    function closeConfirmDialog(confirmed) {
      const modal = document.getElementById('modalConfirmDialog');
      if (modal) modal.classList.remove('active');
      if (confirmDialogResolver) {
        confirmDialogResolver(confirmed);
        confirmDialogResolver = null;
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('modalConfirmDialog');
        if (modal && modal.classList.contains('active')) {
          closeConfirmDialog(false);
        }
      }
    });

    function showToast(message, type = 'info', duration = 3400) {
      let container = document.getElementById('toastContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = 'washq-toast toast-' + type;

      let iconSvg = '';
      if (type === 'success') {
        iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      } else if (type === 'error' || type === 'danger') {
        iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      } else if (type === 'warning') {
        iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
      } else {
        iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
      }

      toast.innerHTML = `
        <div class="toast-icon-badge">${iconSvg}</div>
        <div class="toast-msg-text">${message}</div>
        <button type="button" class="toast-close-btn" onclick="this.parentElement.remove()" title="Cerrar">&times;</button>
      `;

      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.add('toast-show');
      });

      setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => {
          if (toast.parentElement) toast.remove();
        }, 280);
      }, duration);
    }

    // Redirigir llamadas nativas de alert() hacia el sistema Toast para una experiencia fluida
    window.alert = function(msg) {
      if (typeof msg !== 'string') msg = String(msg);
      let type = 'info';
      const lower = msg.toLowerCase();
      if (lower.includes('éxito') || lower.includes('exitosa') || lower.includes('exitoso') || lower.includes('guardad')) {
        type = 'success';
      } else if (lower.includes('error') || lower.includes('restringido') || lower.includes('incorrecto') || lower.includes('invalida') || lower.includes('inválid') || lower.includes('rechazad')) {
        type = 'error';
      } else if (lower.includes('por favor') || lower.includes('complete') || lower.includes('ingrese') || lower.includes('seleccione') || lower.includes('requerid')) {
        type = 'warning';
      }
      showToast(msg, type);
    };

    function isOrderToday(o) {
      if (!o || !o.createdAt) return false;
      const d = new Date(o.createdAt);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth() &&
             d.getDate() === now.getDate();
    }

    function isExpenseToday(e) {
      if (!e) return false;
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (e.date && typeof e.date === 'string' && e.date.includes('-')) {
        return e.date === todayStr;
      }
      if (e.createdAt) {
        const d = new Date(e.createdAt);
        return d.getFullYear() === now.getFullYear() &&
               d.getMonth() === now.getMonth() &&
               d.getDate() === now.getDate();
      }
      return false;
    }

    function getPaymentMethodMeta(pm) {
      const id = (pm.id || '').toLowerCase();
      const name = (pm.name || '').toLowerCase();

      if (id.includes('efectivo') || name.includes('efectivo')) {
        return {
          key: 'efectivo',
          label: 'Efectivo',
          color: '#10B981', // Verde billete
          bg: 'rgba(16, 185, 129, 0.12)',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>'
        };
      }
      if (id.includes('nequi') || name.includes('nequi')) {
        return {
          key: 'nequi',
          label: 'Nequi',
          color: '#DE005E', // Fucsia Nequi oficial
          bg: 'rgba(222, 0, 94, 0.12)',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DE005E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="3"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'
        };
      }
      if (id.includes('davi') || name.includes('davi')) {
        return {
          key: 'daviplata',
          label: 'Daviplata',
          color: '#ED1C24', // Rojo Daviplata oficial
          bg: 'rgba(237, 28, 36, 0.12)',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ED1C24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v8M8 12h8"></path></svg>'
        };
      }
      if (id.includes('banco') || name.includes('banco') || id.includes('transf') || name.includes('transferencia')) {
        return {
          key: 'bancolombia',
          label: 'Bancolombia',
          color: '#002D72', // Azul marino institucional
          bg: 'rgba(0, 45, 114, 0.12)',
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#002D72" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 3l9 7H3l9-7z"></path></svg>'
        };
      }
      return {
        key: 'otro',
        label: pm.name || 'Otro',
        color: '#64748B', // Pizarra neutro
        bg: 'rgba(100, 116, 139, 0.12)',
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>'
      };
    }


    function getWhatsAppLink(order) {
      const cleanPhone = (order.phone || '').replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone;
      const msg = encodeURIComponent(`¡Hola! Tu vehículo con placa *${order.plate}* ya está listo en *${appState.config.businessName}*. Total a pagar: *${formatCOP(order.price)}*. ¡Te esperamos!`);
      return `https://wa.me/${fullPhone}?text=${msg}`;
    }


    // ================= MODAL INGRESO EXPRESS =================
    function isSedeSoloMotos() {
      if (appState && appState.config && appState.config.washType === 'solo_motos') return true;
      if (typeof activeTenant !== 'undefined' && activeTenant && activeTenant.washType === 'solo_motos') return true;
      return false;
    }


    function focusSearch() {
      switchView('historial');
      setTimeout(() => document.getElementById('historySearchInput').focus(), 150);
    }

    function downloadCSV(csv, filename) {
      // Prefijo BOM UTF-8 (\uFEFF) para garantizar que Excel en Windows interprete tildes y eñes correctamente
      const bom = '\uFEFF';
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }