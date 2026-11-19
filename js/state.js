/**
 * WashQ / KodiQuett — Gestión del Estado y Persistencia
 * Control de licencias, autenticación de sede, bloqueo por inactividad y persistencia local/nube.
 */

    function getActivePlan() {
      try {
        const lic = localStorage.getItem('washq_license_info');
        if (lic) {
          const parsed = JSON.parse(lic);
          if (parsed && parsed.plan && PLAN_TIERS[parsed.plan]) {
            return PLAN_TIERS[parsed.plan];
          }
        }
      } catch (e) {}
      // Por defecto para clientes fundadores: Plan Élite completo
      return PLAN_TIERS['elite'];
    }

    function isMultiSedeEnabled() {
      return getActivePlan().allowMultiSede === true;
    }

    // Consulta silenciosa al servidor central de Vercel/Local para verificar el plan de esta sede
    async function checkSystemLicenseWithServer(userTriggered = false) {
      const code = activeTenant ? activeTenant.code : (tenantsRegistry[0] ? tenantsRegistry[0].code : 'CALI-01');
      if (userTriggered) {
        showToast('Consultando estado con servidor Kodiquett...', 'info');
      }

      try {
        const resp = await fetch(`/api/licenses?tenant=${encodeURIComponent(code)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.ok) {
            const planId = data.plan || 'elite';
            const currentPlan = getActivePlan();

            localStorage.setItem('washq_license_info', JSON.stringify({
              code: data.code || code,
              name: data.name || (activeTenant ? activeTenant.name : 'Autolavado'),
              plan: planId,
              verifiedAt: data.verifiedAt || new Date().toISOString()
            }));

            renderAdminSedesList();
            renderLicenseInfo();

            if (userTriggered) {
              showToast(`Licencia sincronizada: ${PLAN_TIERS[planId].name} Activo.`, 'success');
            } else if (currentPlan.id !== planId) {
              showToast(`Plan actualizado por Kodiquett a: ${PLAN_TIERS[planId].name}`, 'info');
            }
            return;
          }
        }
      } catch (err) {
        // Modo offline: se preserva la licencia local sin interrumpir el funcionamiento
        if (userTriggered) {
          showToast(`Operando en modo local fuera de línea: ${getActivePlan().badge}`, 'info');
        }
      }
    }

    function renderLicenseInfo() {
      const plan = getActivePlan();
      const planDesc = document.getElementById('licensePlanDescription');
      const planBadge = document.getElementById('licensePlanBadge');
      const clientBadge = document.getElementById('licenseClientBadge');

      if (planBadge) {
        planBadge.textContent = plan.badge;
        if (plan.id === 'elite') {
          planBadge.style.background = '#ECFDF5';
          planBadge.style.color = '#059669';
          planBadge.style.borderColor = 'rgba(5,150,105,0.2)';
        } else if (plan.id === 'pro') {
          planBadge.style.background = '#EFF6FF';
          planBadge.style.color = '#2563EB';
          planBadge.style.borderColor = 'rgba(37,99,235,0.2)';
        } else {
          planBadge.style.background = '#F3F4F6';
          planBadge.style.color = '#4B5563';
          planBadge.style.borderColor = 'rgba(75,85,99,0.2)';
        }
      }

      if (planDesc) {
        planDesc.textContent = plan.description;
      }

      if (clientBadge) {
        const code = activeTenant ? activeTenant.code : (tenantsRegistry[0] ? tenantsRegistry[0].code : 'CALI-01');
        clientBadge.textContent = `Sede verificada: ${code}`;
      }
    }

    function getTenantStorageKey(tId) {
      return 'washq_tenant_' + (tId || 'cali-express') + '_db';
    }

    function initTenantsRegistry() {
      try {
        const saved = localStorage.getItem('washq_tenants_registry');
        if (saved) {
          tenantsRegistry = JSON.parse(saved);
          // Purga automática y silenciosa de sedes demo (Medellín y Bogotá)
          const cleaned = tenantsRegistry.filter(t => t.id !== 'medellin-detail' && t.id !== 'bogota-ecowash' && t.code !== 'MED-02' && t.code !== 'BOG-03');
          if (cleaned.length !== tenantsRegistry.length) {
            tenantsRegistry = cleaned.length > 0 ? cleaned : [...DEFAULT_TENANTS];
            localStorage.setItem('washq_tenants_registry', JSON.stringify(tenantsRegistry));
          }
        } else {
          tenantsRegistry = [...DEFAULT_TENANTS];
          localStorage.setItem('washq_tenants_registry', JSON.stringify(tenantsRegistry));
        }
      } catch (e) {
        tenantsRegistry = [...DEFAULT_TENANTS];
      }

      // Sincronización silenciosa de plan en segundo plano si hay red
      checkSystemLicenseWithServer(false);
    }

    function checkAuthRouteOrSession() {
      initTenantsRegistry();

      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get('codigo') || urlParams.get('code');
      if (urlCode) {
        const found = tenantsRegistry.find(t => t.code.toUpperCase() === urlCode.toUpperCase());
        if (found) {
          chooseTenantForLogin(found.id);
          return;
        }
      }

      const savedSession = localStorage.getItem('washq_active_session');
      if (savedSession) {
        try {
          const sess = JSON.parse(savedSession);
          const found = tenantsRegistry.find(t => t.id === sess.tenantId);
          if (found) {
            executeLoginSuccess(found, sess.role || 'admin', sess.washerId, sess.washerName, true);
            return;
          }
        } catch (e) {}
      }

      showAuthScreen();
    }

    function showAuthScreen() {
      const authScreen = document.getElementById('authScreen');
      const appShell = document.getElementById('appShell');
      if (authScreen) authScreen.style.display = 'flex';
      if (appShell) appShell.style.display = 'none';

      const step1 = document.getElementById('authStepTenant');
      const step2 = document.getElementById('authStepProfile');
      if (step1) step1.style.display = 'block';
      if (step2) step2.style.display = 'none';

      const codeInput = document.getElementById('tenantCodeInput');
      if (codeInput) {
        codeInput.value = '';
        setTimeout(() => { if (codeInput && typeof codeInput.focus === 'function') codeInput.focus(); }, 150);
      }
      const errEl = document.getElementById('tenantCodeError');
      if (errEl) errEl.style.display = 'none';

      const lastCode = localStorage.getItem('washq_last_tenant_code');
      const lastBox = document.getElementById('authLastTenantBox');
      const lastBtn = document.getElementById('btnQuickLastTenant');
      if (lastCode && lastBox && lastBtn) {
        const lastTenant = tenantsRegistry.find(t => t.code.toUpperCase() === lastCode.toUpperCase());
        if (lastTenant) {
          lastBox.style.display = 'block';
          lastBtn.textContent = lastTenant.name + ' (' + lastTenant.code + ')';
          lastBtn.onclick = () => {
            if (codeInput) codeInput.value = lastTenant.code;
            submitTenantCode();
          };
        } else {
          lastBox.style.display = 'none';
        }
      } else if (lastBox) {
        lastBox.style.display = 'none';
      }
    }

    function quickLoginLastTenant() {
      const lastCode = localStorage.getItem('washq_last_tenant_code');
      if (lastCode) {
        const codeInput = document.getElementById('tenantCodeInput');
        if (codeInput) codeInput.value = lastCode;
        submitTenantCode();
      }
    }

    function submitTenantCode() {
      const input = document.getElementById('tenantCodeInput');
      const code = input ? input.value.trim().toUpperCase() : '';
      const errEl = document.getElementById('tenantCodeError');

      if (!code) {
        if (errEl) {
          errEl.textContent = 'Por favor ingresa el código de tu autolavado (ej: CALI-01).';
          errEl.style.display = 'block';
        }
        return;
      }

      const tenant = tenantsRegistry.find(t => t.code.toUpperCase() === code || t.id.toUpperCase() === code);
      if (tenant) {
        if (errEl) errEl.style.display = 'none';
        chooseTenantForLogin(tenant.id);
      } else {
        if (errEl) {
          errEl.textContent = 'Código "' + code + '" no encontrado o inactivo. Verifica el código o crea una nueva sede.';
          errEl.style.display = 'block';
        }
      }
    }

    function chooseTenantForLogin(tenantId) {
      const tenant = tenantsRegistry.find(t => t.id === tenantId);
      if (!tenant) return;
      activeTenant = tenant;

      const nameEl = document.getElementById('authActiveTenantName');
      const locEl = document.getElementById('authActiveTenantLocation');
      if (nameEl) nameEl.textContent = tenant.name;
      if (locEl) locEl.textContent = tenant.city + ' • Código: ' + tenant.code;

      loadTenantWashersForPicker(tenant.id);

      document.getElementById('authStepTenant').style.display = 'none';
      document.getElementById('authStepProfile').style.display = 'block';

      selectLoginRole('admin');
      clearPinKey();
      const errPin = document.getElementById('authPinError');
      if (errPin) errPin.style.display = 'none';
    }

    function loadTenantWashersForPicker(tenantId) {
      const storageKey = getTenantStorageKey(tenantId);
      let tempWashers = [...DEFAULT_WASHERS];
      try {
        const saved = localStorage.getItem(storageKey) || (tenantId === 'cali-express' ? localStorage.getItem('washq_cali_db') : null);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.washers && parsed.washers.length > 0) {
            tempWashers = parsed.washers;
          }
        }
      } catch (e) {}

      const select = document.getElementById('authWasherSelect');
      if (select) {
        select.innerHTML = '';
        tempWashers.filter(w => w.active !== false).forEach(w => {
          const opt = document.createElement('option');
          opt.value = w.id;
          opt.textContent = w.name;
          select.appendChild(opt);
        });
      }
    }

    function backToTenantStep() {
      document.getElementById('authStepTenant').style.display = 'block';
      document.getElementById('authStepProfile').style.display = 'none';
    }

    function selectLoginRole(roleId) {
      selectedAuthRole = roleId;
      document.querySelectorAll('.role-login-card').forEach(c => c.classList.remove('selected'));
      const activeCard = document.getElementById('authRoleCard-' + roleId);
      if (activeCard) activeCard.classList.add('selected');

      const pinContainer = document.getElementById('authPinContainer');
      const operarioGroup = document.getElementById('authOperarioPickerGroup');
      const pinHint = document.getElementById('pinHintText');
      const pinLabel = document.querySelector('#authPinContainer .form-label span');

      if (roleId === 'operario' || roleId === 'lavador') {
        if (operarioGroup) operarioGroup.style.display = 'block';
        if (pinContainer) pinContainer.style.display = 'flex';
        if (pinLabel) pinLabel.textContent = 'Ingresa tu PIN personal de operario';
        updateOperarioPinHint();
      } else {
        if (operarioGroup) operarioGroup.style.display = 'none';
        if (pinContainer) pinContainer.style.display = 'flex';
        if (pinLabel) pinLabel.textContent = 'Ingresa el PIN de seguridad de tu perfil';
        if (pinHint) {
          if (roleId === 'admin') pinHint.textContent = 'PIN Demo: ' + (activeTenant ? activeTenant.adminPin || '1234' : '1234');
          else pinHint.textContent = 'PIN Demo: ' + (activeTenant ? activeTenant.cajeroPin || '0000' : '0000');
        }
      }

      clearPinKey();
      const errPin = document.getElementById('authPinError');
      if (errPin) errPin.style.display = 'none';
      setTimeout(() => {
        const pinIn = document.getElementById('authPinInput');
        if (pinIn && typeof pinIn.focus === 'function') pinIn.focus();
      }, 150);
    }

    function onAuthWasherSelectChange() {
      clearPinKey();
      const errPin = document.getElementById('authPinError');
      if (errPin) errPin.style.display = 'none';
      updateOperarioPinHint();
      const pinIn = document.getElementById('authPinInput');
      if (pinIn && typeof pinIn.focus === 'function') pinIn.focus();
    }

    function updateOperarioPinHint() {
      const pinHint = document.getElementById('pinHintText');
      const select = document.getElementById('authWasherSelect');
      if (!pinHint || !select) return;

      const washerId = select.value;
      const tenantId = activeTenant ? activeTenant.id : 'cali-express';
      const storageKey = getTenantStorageKey(tenantId);
      let washers = [...DEFAULT_WASHERS];
      try {
        const saved = localStorage.getItem(storageKey) || (tenantId === 'cali-express' ? localStorage.getItem('washq_cali_db') : null);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.washers && parsed.washers.length > 0) washers = parsed.washers;
        }
      } catch (e) {}

      const found = washers.find(w => w.id === washerId);
      const wName = found ? found.name.split(' ')[0] : 'Operario';
      const wPin = found ? (found.pin || '1111') : '1111';
      pinHint.textContent = 'PIN Demo ' + wName + ': ' + wPin;
    }

    function submitAuthLogin() {
      if (!activeTenant) return;
      const pinEl = document.getElementById('authPinInput');
      const enteredPin = pinEl ? pinEl.value.trim() : '';

      if (selectedAuthRole === 'operario' || selectedAuthRole === 'lavador') {
        const select = document.getElementById('authWasherSelect');
        const washerId = select ? select.value : null;

        const tenantId = activeTenant.id;
        const storageKey = getTenantStorageKey(tenantId);
        let washers = [...DEFAULT_WASHERS];
        try {
          const saved = localStorage.getItem(storageKey) || (tenantId === 'cali-express' ? localStorage.getItem('washq_cali_db') : null);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.washers && parsed.washers.length > 0) washers = parsed.washers;
          }
        } catch (e) {}

        const washer = washers.find(w => w.id === washerId);
        if (!washer) {
          alert('Por favor selecciona un operario.');
          return;
        }

        const expectedPin = washer.pin || '1111';
        if (enteredPin === expectedPin) {
          const rememberEl = document.getElementById('rememberSessionCheck');
          const remember = rememberEl ? rememberEl.checked : true;
          executeLoginSuccess(activeTenant, 'operario', washer.id, washer.name, remember);
        } else {
          const err = document.getElementById('authPinError');
          if (err) {
            err.textContent = 'PIN incorrecto para ' + washer.name + '. Verifica tu clave de acceso.';
            err.style.display = 'block';
          }
          clearPinKey();
        }
        return;
      }

      let expectedPin = '1234';
      if (selectedAuthRole === 'admin') {
        expectedPin = activeTenant.adminPin || '1234';
      } else if (selectedAuthRole === 'cajero') {
        expectedPin = activeTenant.cajeroPin || '0000';
      }

      if (enteredPin === expectedPin) {
        const rememberEl = document.getElementById('rememberSessionCheck');
        const remember = rememberEl ? rememberEl.checked : true;
        executeLoginSuccess(activeTenant, selectedAuthRole, null, null, remember);
      } else {
        const err = document.getElementById('authPinError');
        if (err) {
          err.textContent = 'PIN incorrecto. Intenta nuevamente.';
          err.style.display = 'block';
        }
        clearPinKey();
      }
    }

    function pressPinKey(digit) {
      const input = document.getElementById('authPinInput');
      if (input && input.value.length < 4) {
        input.value += digit;
      }
      if (input && input.value.length === 4) {
        setTimeout(submitAuthLogin, 120);
      }
    }

    function deletePinKey() {
      const input = document.getElementById('authPinInput');
      if (input) input.value = input.value.slice(0, -1);
    }

    function clearPinKey() {
      const input = document.getElementById('authPinInput');
      if (input) input.value = '';
    }



    function executeLoginSuccess(tenant, role, washerId, washerName, remember) {
      activeTenant = tenant;
      appState.tenantId = tenant.id;

      if (remember) {
        localStorage.setItem('washq_active_session', JSON.stringify({
          tenantId: tenant.id,
          role: role,
          washerId: washerId,
          washerName: washerName
        }));
        localStorage.setItem('washq_last_tenant_code', tenant.code);
      }

      loadFromStorage(tenant.id);

      const liveDateEl = document.getElementById('currentLiveDate');
      if (liveDateEl) liveDateEl.innerHTML = tenant.name + ' &middot; ' + tenant.code;

      const authScreen = document.getElementById('authScreen');
      const appShell = document.getElementById('appShell');
      if (authScreen) authScreen.style.display = 'none';
      if (appShell) appShell.style.display = 'flex';

      setRole(role, washerId, washerName);
    }

    

    // CONTROL DE INACTIVIDAD Y BLOQUEO AUTOMÁTICO DE PANTALLA
    // ==========================================================================
    let lastUserActivityTime = Date.now();
    let isScreenLocked = false;
    let inactivityWatchdogInterval = null;

    function recordUserActivity() {
      if (!isScreenLocked) {
        lastUserActivityTime = Date.now();
      }
    }

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    function startInactivityWatchdog() {
      if (inactivityWatchdogInterval) clearInterval(inactivityWatchdogInterval);
      inactivityWatchdogInterval = setInterval(checkInactivityTimeout, 15000);
    }

    function checkInactivityTimeout() {
      const appShell = document.getElementById('appShell');
      if (!appShell || appShell.style.display === 'none') return;
      if (isScreenLocked) return;

      const timeoutMinutes = appState.config && typeof appState.config.lockTimeoutMinutes === 'number'
        ? appState.config.lockTimeoutMinutes
        : 5;

      if (timeoutMinutes <= 0) return; // Desactivado

      const timeoutMs = timeoutMinutes * 60 * 1000;
      if (Date.now() - lastUserActivityTime >= timeoutMs) {
        triggerScreenLock();
      }
    }

    function triggerScreenLock() {
      if (isScreenLocked) return;
      isScreenLocked = true;

      const overlay = document.getElementById('lockScreenOverlay');
      const nameEl = document.getElementById('lockUserName');
      const tenantEl = document.getElementById('lockTenantName');
      const iconEl = document.getElementById('lockUserIcon');
      const pinIn = document.getElementById('lockPinInput');
      const errEl = document.getElementById('lockPinError');

      if (tenantEl && activeTenant) tenantEl.textContent = activeTenant.name;
      if (nameEl) {
        if (appState.currentRole === 'admin') {
          nameEl.textContent = 'Administrador';
          if (iconEl) iconEl.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="margin-right: 2px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>';
        } else if (appState.currentRole === 'cajero') {
          nameEl.textContent = 'Cajero';
          if (iconEl) iconEl.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="margin-right: 2px;"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>';
        } else {
          nameEl.textContent = appState.currentWasherName || 'Operario';
          if (iconEl) iconEl.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="margin-right: 2px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
        }
      }

      if (pinIn) pinIn.value = '';
      if (errEl) errEl.style.display = 'none';

      if (overlay) overlay.style.display = 'flex';
      setTimeout(() => { if (pinIn && typeof pinIn.focus === 'function') pinIn.focus(); }, 120);
    }

    function pressLockPinKey(num) {
      const pinIn = document.getElementById('lockPinInput');
      if (pinIn && pinIn.value.length < 4) {
        pinIn.value += num;
        if (pinIn.value.length === 4) submitUnlockPin();
      }
    }

    function clearLockPinKey() {
      const pinIn = document.getElementById('lockPinInput');
      if (pinIn) pinIn.value = '';
      const errEl = document.getElementById('lockPinError');
      if (errEl) errEl.style.display = 'none';
    }

    function backspaceLockPinKey() {
      const pinIn = document.getElementById('lockPinInput');
      if (pinIn) pinIn.value = pinIn.value.slice(0, -1);
    }

    function submitUnlockPin() {
      const pinIn = document.getElementById('lockPinInput');
      const errEl = document.getElementById('lockPinError');
      const enteredPin = pinIn ? pinIn.value.trim() : '';

      let expectedPin = '1234';
      if (appState.currentRole === 'admin') {
        expectedPin = activeTenant ? (activeTenant.adminPin || '1234') : '1234';
      } else if (appState.currentRole === 'cajero') {
        expectedPin = activeTenant ? (activeTenant.cajeroPin || '0000') : '0000';
      } else {
        const washer = appState.washers.find(w => w.id === appState.currentWasherId);
        expectedPin = washer ? (washer.pin || '1111') : '1111';
      }

      if (enteredPin === expectedPin) {
        isScreenLocked = false;
        lastUserActivityTime = Date.now();
        const overlay = document.getElementById('lockScreenOverlay');
        if (overlay) overlay.style.display = 'none';
        showToast('Terminal desbloqueado.', 'success');
      } else {
        if (errEl) errEl.style.display = 'block';
        if (pinIn) pinIn.value = '';
      }
    }

    function unlockAndSwitchSession() {
      isScreenLocked = false;
      const overlay = document.getElementById('lockScreenOverlay');
      if (overlay) overlay.style.display = 'none';
      logoutTenant();
    }

    // Renderizado de sedes en la sección de administración
    function renderAdminSedesList() {
      const container = document.getElementById('adminSedesList');
      if (!container) return;
      container.innerHTML = '';

      // El botón "+ Nueva Sede" SOLO existe y se muestra si el plan es Élite (Multi-Sede)
      const btnNuevaSede = document.getElementById('btnNuevaSede');
      const multiAllowed = isMultiSedeEnabled();
      if (btnNuevaSede) {
        btnNuevaSede.style.display = multiAllowed ? 'inline-block' : 'none';
      }

      const subTitle = document.getElementById('sedesSectionSubtitle');
      if (subTitle) {
        subTitle.textContent = multiAllowed
          ? 'Administra tus sucursales y registra nuevas sedes'
          : 'Sede principal configurada (Plan 1 Sede activo)';
      }

      tenantsRegistry.forEach(t => {
        const isCurrent = activeTenant && activeTenant.id === t.id;
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-surface-subtle); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);';
        const typeBadge = t.washType === 'solo_motos'
          ? '<span style="font-size: 0.7rem; color: #D97706; background: #FEF3C7; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Solo Motos</span>'
          : '<span style="font-size: 0.7rem; color: #2563EB; background: #EFF6FF; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Mixto</span>';

        item.innerHTML = `
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <strong style="font-size: 0.88rem; color: var(--text-title);">${t.name}</strong>
              <span style="font-family: var(--font-mono); font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; background: var(--bg-canvas); border: 1px solid var(--border-subtle); font-weight: 700;">${t.code}</span>
              ${typeBadge}
              ${isCurrent ? '<span style="font-size: 0.7rem; color: #059669; font-weight: 700; background: #ECFDF5; padding: 2px 6px; border-radius: 4px;">Sede Actual</span>' : ''}
            </div>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 3px;">${t.address || t.city || 'Colombia'}</p>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            ${!isCurrent ? `
              <button type="button" class="btn-card-action" style="font-size: 0.75rem; padding: 4px 10px;" onclick="switchTenantDirect('${t.id}')">Cambiar a esta sede</button>
              <button type="button" class="btn-card-action" style="font-size: 0.75rem; padding: 5px 8px; color: #DC2626; border-color: rgba(220,38,38,0.3); background: #FEF2F2;" onclick="deleteTenant('${t.id}')" title="Eliminar sede">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            ` : '<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">En uso</span>'}
          </div>
        `;
        container.appendChild(item);
      });
    }

    async function deleteTenant(tenantId) {
      if (appState.currentRole !== 'admin') {
        showToast('Solo el administrador puede eliminar sedes.', 'error');
        return;
      }
      const target = tenantsRegistry.find(t => t.id === tenantId);
      if (!target) return;
      if (activeTenant && activeTenant.id === tenantId) {
        showToast('No puedes eliminar la sede que está actualmente en uso.', 'warning');
        return;
      }
      if (tenantsRegistry.length <= 1) {
        showToast('Debe existir al menos una sede principal registrada.', 'warning');
        return;
      }

      const confirmed = await showConfirmDialog({
        title: '¿Eliminar sede ' + target.name + '?',
        message: 'Se eliminará la sede ' + target.name + ' (' + target.code + ') de este equipo.',
        confirmText: 'Sí, Eliminar Sede',
        cancelText: 'Cancelar',
        type: 'danger'
      });

      if (!confirmed) return;

      tenantsRegistry = tenantsRegistry.filter(t => t.id !== tenantId);
      localStorage.setItem('washq_tenants_registry', JSON.stringify(tenantsRegistry));
      try {
        localStorage.removeItem(getTenantStorageKey(tenantId));
      } catch (e) {}

      showToast('Sede eliminada correctamente.', 'success');
      renderAdminSedesList();
      renderLicenseInfo();
    }

    function switchTenantDirect(targetTenantId) {
      const target = tenantsRegistry.find(t => t.id === targetTenantId);
      if (!target) return;
      executeLoginSuccess(target, 'admin', null, null, true);
      showToast('Cambiado a sede ' + target.name, 'info');
      renderAllViews();
    }

    // ==========================================================================

    async function logoutTenant() {
      const tenantName = activeTenant ? activeTenant.name : 'tu autolavado';
      const confirmed = await showConfirmDialog({
        title: '¿Cerrar sesión de esta sede?',
        message: 'Estás en ' + tenantName + '. Volverás a la pantalla de acceso y podrás reingresar con tu código y PIN.',
        confirmText: 'Cerrar Sesión',
        cancelText: 'Permanecer en el panel',
        type: 'danger'
      });

      if (!confirmed) return;

      localStorage.removeItem('washq_active_session');
      activeTenant = null;
      appState.tenantId = null;
      showAuthScreen();
      showToast('Has cerrado sesión correctamente.', 'info');
    }

    function openCreateTenantModal() {
      if (appState.currentRole !== 'admin') {
        showToast('Acceso restringido: solo el administrador puede registrar nuevas sedes.', 'error');
        return;
      }
      if (!isMultiSedeEnabled()) {
        showToast('Tu plan actual incluye 1 sola sede física. Para habilitar Multi-Sede adquiere la ampliación a Plan Élite con Kodiquett.', 'warning');
        return;
      }
      document.getElementById('newTenantName').value = '';
      document.getElementById('newTenantCity').value = activeTenant ? activeTenant.city || 'Cali' : 'Cali';
      document.getElementById('newTenantAddress').value = '';
      document.getElementById('newTenantCode').value = '';
      document.getElementById('newTenantPin').value = '1234';
      const wtSel = document.getElementById('newTenantWashType');
      if (wtSel) wtSel.value = 'mixto';
      openModal('modalCreateTenant');
    }

    function saveNewTenant() {
      const name = document.getElementById('newTenantName').value.trim();
      const city = document.getElementById('newTenantCity').value.trim() || 'Colombia';
      const address = document.getElementById('newTenantAddress').value.trim();
      const code = document.getElementById('newTenantCode').value.trim().toUpperCase();
      const pin = document.getElementById('newTenantPin').value.trim() || '1234';
      const washType = (document.getElementById('newTenantWashType') ? document.getElementById('newTenantWashType').value : 'mixto') || 'mixto';

      if (!name || !code) {
        alert('Por favor ingresa el nombre del autolavado y un código único (ej: CALI-02).');
        return;
      }

      if (tenantsRegistry.some(t => t.code.toUpperCase() === code)) {
        alert('Ya existe una sede con el código "' + code + '". Por favor elige otro.');
        return;
      }

      const newTenant = {
        id: 't_' + Date.now(),
        code: code,
        name: name,
        city: city,
        address: address || city,
        phone: '',
        ownerPhone: '',
        active: true,
        adminPin: pin,
        cajeroPin: '0000',
        washType: washType
      };

      tenantsRegistry.push(newTenant);
      localStorage.setItem('washq_tenants_registry', JSON.stringify(tenantsRegistry));

      closeModal('modalCreateTenant');
      alert('Sede "' + name + '" registrada con éxito.\nCódigo de ingreso: ' + code + '\nEspecialidad: ' + (washType === 'solo_motos' ? 'Exclusivo Motos' : 'Mixto'));

      chooseTenantForLogin(newTenant.id);
    }

    function loadFromStorage(tenantId) {
      const tId = tenantId || (activeTenant ? activeTenant.id : (appState.tenantId || 'cali-express'));
      try {
        const storageKey = getTenantStorageKey(tId);
        let saved = localStorage.getItem(storageKey);
        if (!saved && tId === 'cali-express') {
          saved = localStorage.getItem('washq_cali_db');
        }
        if (saved) {
          appState = { ...appState, ...JSON.parse(saved), tenantId: tId };
          if (!appState.expenseCategories || appState.expenseCategories.length === 0) {
            appState.expenseCategories = [...DEFAULT_EXPENSE_CATEGORIES];
          }
        } else {
          seedInitialOrders();
          saveToStorage();
        }
      } catch (e) {
        console.error('Error cargando storage:', e);
      }
    }

    function saveToStorage() {
      try {
        const tId = appState.tenantId || (activeTenant ? activeTenant.id : 'cali-express');
        const storageKey = getTenantStorageKey(tId);
        localStorage.setItem(storageKey, JSON.stringify(appState));
        if (tId === 'cali-express') {
          localStorage.setItem('washq_cali_db', JSON.stringify(appState));
        }
      } catch (e) {
        console.error('Error guardando storage:', e);
      }
    }

    function seedInitialOrders() {
      const now = Date.now();
      const oneDay = 24 * 3600 * 1000;

      appState.orders = [
        // Órdenes de HOY
        {
          id: 'ord_1',
          ticketNumber: 1,
          plate: 'ABC-123',
          vehicleType: 'carro',
          serviceId: 's_c2',
          serviceName: 'Lavado General (Interior + Exterior)',
          price: 26000,
          washerId: 'w_1',
          washerName: 'Carlos Murillo',
          commission: 10400,
          createdAt: now - (4 * 3600 * 1000),
          estimatedDuration: 40,
          estimatedDelivery: now - (3 * 3600 * 1000),
          status: 'entregado',
          phone: '3151234567',
          notes: 'Cuidado con retrovisor',
          paymentMethod: 'Efectivo'
        },
        {
          id: 'ord_2',
          ticketNumber: 2,
          plate: 'WXQ-45E',
          vehicleType: 'moto',
          serviceId: 's_m2',
          serviceName: 'Lavado Especial + Silicona',
          price: 18000,
          washerId: 'w_2',
          washerName: 'Andrés Valencia',
          commission: 7200,
          createdAt: now - (3 * 3600 * 1000),
          estimatedDuration: 30,
          estimatedDelivery: now - (2 * 3600 * 1000),
          status: 'entregado',
          phone: '',
          notes: '',
          paymentMethod: 'Nequi'
        },
        {
          id: 'ord_3',
          ticketNumber: 3,
          plate: 'KDY-890',
          vehicleType: 'suv',
          serviceId: 's_suv2',
          serviceName: 'Lavado Full + Motor SUV',
          price: 60000,
          washerId: 'w_3',
          washerName: 'Jhon Alexander Gómez',
          commission: 24000,
          createdAt: now - (45 * 60 * 1000),
          estimatedDuration: 75,
          estimatedDelivery: now + (30 * 60 * 1000),
          status: 'lavando',
          phone: '3187654321',
          notes: '',
          paymentMethod: null
        },
        {
          id: 'ord_4',
          ticketNumber: 4,
          plate: 'VAA-201',
          vehicleType: 'carro',
          serviceId: 's_c1',
          serviceName: 'Lavado Sencillo (Solo Por Fuera)',
          price: 18000,
          washerId: 'w_1',
          washerName: 'Carlos Murillo',
          commission: 7200,
          createdAt: now - (10 * 60 * 1000),
          estimatedDuration: 25,
          estimatedDelivery: now + (15 * 60 * 1000),
          status: 'espera',
          phone: '',
          notes: '',
          paymentMethod: null
        },
        // Órdenes de AYER (para cálculo real y auténtico de tendencia diaria)
        {
          id: 'ord_prev_1',
          ticketNumber: 101,
          plate: 'TXQ-901',
          vehicleType: 'carro',
          serviceId: 's_c2',
          serviceName: 'Lavado General',
          price: 26000,
          washerId: 'w_1',
          washerName: 'Carlos Murillo',
          commission: 10400,
          createdAt: now - oneDay - (2 * 3600 * 1000),
          status: 'entregado',
          paymentMethod: 'Efectivo'
        },
        {
          id: 'ord_prev_2',
          ticketNumber: 102,
          plate: 'NMH-442',
          vehicleType: 'suv',
          serviceId: 's_suv1',
          serviceName: 'Lavado General SUV',
          price: 35000,
          washerId: 'w_2',
          washerName: 'Andrés Valencia',
          commission: 14000,
          createdAt: now - oneDay - (4 * 3600 * 1000),
          status: 'entregado',
          paymentMethod: 'Daviplata'
        },
        {
          id: 'ord_prev_3',
          ticketNumber: 103,
          plate: 'PLK-112',
          vehicleType: 'moto',
          serviceId: 's_m1',
          serviceName: 'Lavado Sencillo Moto',
          price: 12000,
          washerId: 'w_3',
          washerName: 'Jhon Alexander Gómez',
          commission: 4800,
          createdAt: now - oneDay - (6 * 3600 * 1000),
          status: 'entregado',
          paymentMethod: 'Efectivo'
        },
        // Órdenes de días anteriores para cálculo semanal y mensual
        {
          id: 'ord_hist_1',
          ticketNumber: 90,
          plate: 'ZXC-800',
          vehicleType: 'carro',
          serviceId: 's_c3',
          serviceName: 'Lavado Full + Motor',
          price: 45000,
          washerId: 'w_1',
          washerName: 'Carlos Murillo',
          commission: 18000,
          createdAt: now - (3 * oneDay),
          status: 'entregado',
          paymentMethod: 'Bancolombia'
        },
        {
          id: 'ord_hist_2',
          ticketNumber: 91,
          plate: 'RTY-320',
          vehicleType: 'suv',
          serviceId: 's_suv2',
          serviceName: 'Lavado Full SUV',
          price: 60000,
          washerId: 'w_3',
          washerName: 'Jhon Alexander Gómez',
          commission: 24000,
          createdAt: now - (5 * oneDay),
          status: 'entregado',
          paymentMethod: 'Efectivo'
        },
        {
          id: 'ord_hist_prevweek',
          ticketNumber: 80,
          plate: 'QWE-555',
          vehicleType: 'carro',
          serviceId: 's_c2',
          serviceName: 'Lavado General',
          price: 26000,
          washerId: 'w_2',
          washerName: 'Andrés Valencia',
          commission: 10400,
          createdAt: now - (10 * oneDay),
          status: 'entregado',
          paymentMethod: 'Nequi'
        }
      ];

      appState.expenses = [
        { id: 'exp_1', desc: 'Compra de cera y silicona', category: 'Insumos de Lavado', amount: 25000, date: now - (2 * 3600 * 1000) },
        { id: 'exp_2', desc: 'Almuerzo operarios en turno', category: 'Alimentación & Refrigerios', amount: 32000, date: now - (5 * 3600 * 1000) },
        { id: 'exp_prev_1', desc: 'Compra de trapos de microfibra', category: 'Insumos de Lavado', amount: 18000, date: now - oneDay - (3 * 3600 * 1000) }
      ];
    }