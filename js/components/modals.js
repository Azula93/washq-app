/**
 * WashQ / KodiQuett — Control de Modales y Seguridad por PIN
 * Apertura/cierre de hojas modales, teclado numérico táctil y validación de roles.
 */

    function openRolePinModal() {
      const pinGroup = document.getElementById('pinInputGroup');
      const washerGroup = document.getElementById('washerSelectGroup');
      const pinErr = document.getElementById('pinErrorMsg');
      if (pinGroup) pinGroup.style.display = 'none';
      if (washerGroup) washerGroup.style.display = 'none';
      if (pinErr) pinErr.style.display = 'none';
      openModal('modalRolePin');
    }

    function requestSwitchRole(roleId) {
      appState.pendingRoleSwitch = roleId;
      const pinGroup = document.getElementById('pinInputGroup');
      const washerGroup = document.getElementById('washerSelectGroup');
      const pinErr = document.getElementById('pinErrorMsg');
      const operarioPinErr = document.getElementById('roleOperarioPinError');
      if (pinErr) pinErr.style.display = 'none';
      if (operarioPinErr) operarioPinErr.style.display = 'none';

      if (roleId === 'operario' || roleId === 'lavador') {
        if (pinGroup) pinGroup.style.display = 'none';
        if (washerGroup) {
          washerGroup.style.display = 'block';
          const select = document.getElementById('roleWasherSelect');
          select.innerHTML = '';
          appState.washers.filter(w => w.active !== false).forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.id;
            opt.textContent = w.name;
            select.appendChild(opt);
          });
          onRoleWasherSelectChange();
        }
      } else {
        if (washerGroup) washerGroup.style.display = 'none';
        if (pinGroup) {
          pinGroup.style.display = 'block';
          const input = document.getElementById('rolePinInput');
          input.value = '';
          setTimeout(() => { if (input && typeof input.focus === 'function') input.focus(); }, 150);
        }
      }
    }

    function onRoleWasherSelectChange() {
      const pinIn = document.getElementById('roleOperarioPinInput');
      if (pinIn) pinIn.value = '';
      const err = document.getElementById('roleOperarioPinError');
      if (err) err.style.display = 'none';

      const select = document.getElementById('roleWasherSelect');
      const hint = document.getElementById('roleOperarioHintText');
      if (select && hint) {
        const washer = appState.washers.find(w => w.id === select.value);
        if (washer) {
          hint.textContent = 'PIN Demo de ' + washer.name.split(' ')[0] + ': ' + (washer.pin || '1111');
        }
      }
      if (pinIn && typeof pinIn.focus === 'function') pinIn.focus();
    }

    function confirmSwitchToOperario() {
      const select = document.getElementById('roleWasherSelect');
      const washerId = select ? select.value : (appState.washers[0] ? appState.washers[0].id : null);
      const washer = appState.washers.find(w => w.id === washerId);
      if (!washer) return;

      const pinIn = document.getElementById('roleOperarioPinInput');
      const enteredPin = pinIn ? pinIn.value.trim() : '';
      const expectedPin = washer.pin || '1111';

      if (enteredPin === expectedPin) {
        closeModal('modalRolePin');
        setRole('operario', washer.id, washer.name);
      } else {
        const err = document.getElementById('roleOperarioPinError');
        if (err) {
          err.textContent = 'PIN incorrecto para ' + washer.name + '.';
          err.style.display = 'block';
        }
        if (pinIn) pinIn.value = '';
      }
    }

    function verifyRolePin() {
      const pin = document.getElementById('rolePinInput').value;
      const roleId = appState.pendingRoleSwitch;
      const role = appState.roles.find(r => r.id === roleId);

      let expectedPin = '1234';
      if (role) expectedPin = role.pin;
      else if (roleId === 'admin') expectedPin = '1234';
      else if (roleId === 'cajero') expectedPin = '0000';

      if (pin === expectedPin) {
        closeModal('modalRolePin');
        setRole(roleId);
      } else {
        const err = document.getElementById('pinErrorMsg');
        if (err) err.style.display = 'block';
      }
    }

    function setRole(roleId, washerId, washerName) {
      appState.currentRole = roleId;
      const isOperario = roleId === 'operario' || roleId === 'lavador';

      if (isOperario) {
        appState.currentWasherId = washerId || (appState.washers[0] ? appState.washers[0].id : null);
        const wObj = appState.washers.find(w => w.id === appState.currentWasherId);
        appState.currentWasherName = washerName || (wObj ? wObj.name : 'Operario');
      } else {
        appState.currentWasherId = null;
        appState.currentWasherName = null;
      }

      // Actualizar cabecera
      const iconEl = document.getElementById('headerRoleIcon');
      const nameEl = document.getElementById('headerRoleName');
      const badge = document.getElementById('adminControlBadge');

      if (roleId === 'admin') {
        if (iconEl) iconEl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>';
        if (nameEl) nameEl.textContent = 'Super Admin';
        if (badge) {
          badge.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Administrador';
          badge.style.background = 'var(--accent-subtle)';
          badge.style.color = 'var(--accent-primary)';
          badge.style.borderColor = 'var(--accent-border)';
        }
      } else if (roleId === 'cajero') {
        if (iconEl) iconEl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>';
        if (nameEl) nameEl.textContent = 'Cajero';
        if (badge) {
          badge.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg> Cajero';
          badge.style.background = 'var(--accent-subtle)';
          badge.style.color = 'var(--accent-primary)';
          badge.style.borderColor = 'var(--accent-border)';
        }
      } else {
        if (iconEl) iconEl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
        if (nameEl) nameEl.textContent = appState.currentWasherName || 'Operario';
        if (badge) {
          badge.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> ' + (appState.currentWasherName || 'Operario');
          badge.style.background = '#F1F5F9';
          badge.style.color = '#475569';
          badge.style.borderColor = '#CBD5E1';
        }
      }

      applyRoleInterfaceRestrictions(roleId);
      renderAllViews();
      saveToStorage();
    }

    function applyRoleInterfaceRestrictions(roleId) {
      const isOperario = roleId === 'operario' || roleId === 'lavador';
      const isCajero = roleId === 'cajero';
      const isAdmin = roleId === 'admin';

      const navOverview = document.getElementById('nav-overview');
      const navCaja = document.getElementById('nav-caja');
      const navConfig = document.getElementById('nav-config');
      const navComisiones = document.getElementById('nav-comisiones');
      const navLabelComisiones = document.getElementById('navLabelComisiones');

      const mobOverview = document.getElementById('mob-nav-overview');
      const mobCaja = document.getElementById('mob-nav-caja');
      const mobConfig = document.getElementById('mob-nav-config');
      const mobLabelComisiones = document.getElementById('mobLabelComisiones');

      const runwayWidget = document.getElementById('sidebarRunwayWidget');
      const restrictedBanner = document.getElementById('patioRestrictedBanner');
      const btnHeaderQuickNew = document.getElementById('btnHeaderQuickNew');
      const btnAddNewWasher = document.getElementById('btnAddNewWasher');

      const activeEl = document.querySelector('.view-container.active');
      const currentViewId = activeEl ? activeEl.id.replace('view-', '') : 'overview';

      if (isOperario) {
        if (navOverview) navOverview.style.display = 'none';
        if (navCaja) navCaja.style.display = 'none';
        if (navConfig) navConfig.style.display = 'none';

        if (mobOverview) mobOverview.style.display = 'none';
        if (mobCaja) mobCaja.style.display = 'none';
        if (mobConfig) mobConfig.style.display = 'none';

        if (runwayWidget) runwayWidget.style.display = 'none';
        if (restrictedBanner) restrictedBanner.style.display = 'flex';

        // EL OPERARIO NUNCA DEBE CREAR NUEVOS OPERARIOS
        if (btnAddNewWasher) btnAddNewWasher.style.display = 'none';
        if (btnHeaderQuickNew) btnHeaderQuickNew.style.display = 'none';

        if (navLabelComisiones) navLabelComisiones.textContent = 'Mis Ganancias';
        if (mobLabelComisiones) mobLabelComisiones.textContent = 'Mis Ganancias';

        const welcomeTxt = document.getElementById('patioWasherWelcomeText');
        if (welcomeTxt) {
          welcomeTxt.innerHTML = `Operario en Turno: <strong>${appState.currentWasherName || 'Operario'}</strong>`;
        }

        if (currentViewId !== 'patio' && currentViewId !== 'comisiones' && currentViewId !== 'historial') {
          switchView('patio');
        } else {
          switchView(currentViewId);
        }
      } else if (isCajero) {
        if (navOverview) navOverview.style.display = 'block';
        if (navCaja) navCaja.style.display = 'block';
        if (navConfig) navConfig.style.display = 'none';

        if (mobOverview) mobOverview.style.display = 'flex';
        if (mobCaja) mobCaja.style.display = 'flex';
        if (mobConfig) mobConfig.style.display = 'none';

        if (runwayWidget) runwayWidget.style.display = 'block';
        if (restrictedBanner) restrictedBanner.style.display = 'none';

        if (btnAddNewWasher) btnAddNewWasher.style.display = 'none';
        if (btnHeaderQuickNew) btnHeaderQuickNew.style.display = 'inline-flex';

        if (navLabelComisiones) navLabelComisiones.textContent = 'Liquidación de Operarios';
        if (mobLabelComisiones) mobLabelComisiones.textContent = 'Operarios';

        if (currentViewId === 'config') {
          switchView('patio');
        } else {
          switchView(currentViewId);
        }
      } else {
        // Admin
        if (navOverview) navOverview.style.display = 'block';
        if (navCaja) navCaja.style.display = 'block';
        if (navConfig) navConfig.style.display = 'block';

        if (mobOverview) mobOverview.style.display = 'flex';
        if (mobCaja) mobCaja.style.display = 'flex';
        if (mobConfig) mobConfig.style.display = 'flex';

        if (runwayWidget) runwayWidget.style.display = 'block';
        if (restrictedBanner) restrictedBanner.style.display = 'none';

        if (btnAddNewWasher) btnAddNewWasher.style.display = 'inline-flex';
        if (btnHeaderQuickNew) btnHeaderQuickNew.style.display = 'inline-flex';

        if (navLabelComisiones) navLabelComisiones.textContent = 'Liquidación de Operarios';
        if (mobLabelComisiones) mobLabelComisiones.textContent = 'Operarios';

        switchView(currentViewId);
      }
    }

    function openModal(modalId) {
      document.getElementById(modalId).classList.add('active');
    }

    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
    }

    function closeAllModals() {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }