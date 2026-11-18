/**
 * WashQ / KodiQuett — Vista de Operarios y Comisiones
 * Liquidación de turnos, pago de comisiones y modo privado para operarios.
 */

    function renderWashers() {
      const grid = document.getElementById('washersCardsGrid');
      if (!grid) return;
      grid.innerHTML = '';

      const isOperario = appState.currentRole === 'operario' || appState.currentRole === 'lavador';
      const myWasherId = appState.currentWasherId;

      const viewTitle = document.getElementById('washersViewTitle');
      const viewSubtitle = document.getElementById('washersViewSubtitle');
      const btnNewWasher = document.getElementById('btnAddNewWasher');

      // =========================================================================
      // MODO PRIVADO DE OPERARIO: Solo ve su propia liquidación, jamás la de otros
      // =========================================================================
      if (isOperario) {
        if (viewTitle) viewTitle.textContent = 'Mis Ganancias del Día';
        if (viewSubtitle) viewSubtitle.textContent = `Hola, ${appState.currentWasherName || 'Operario'}. Resumen de tus vehículos atendidos y comisiones acumuladas hoy.`;
        if (btnNewWasher) btnNewWasher.style.display = 'none';

        // Buscar estrictamente su propio perfil
        const myProfile = appState.washers.find(w => w.id === myWasherId) || appState.washers[0];
        if (!myProfile) {
          grid.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);">No se encontró el perfil de operario.</div>';
          return;
        }

        const myDeliveredOrders = appState.orders.filter(o => o.washerId === myProfile.id && o.status === 'entregado');
        const myActiveOrders = appState.orders.filter(o => o.washerId === myProfile.id && (o.status === 'lavando' || o.status === 'espera'));
        const myTotalCommission = myDeliveredOrders.reduce((sum, o) => sum + (o.commission || 0), 0);

        const card = document.createElement('div');
        card.className = 'washer-profile-card';
        card.style.gridColumn = '1 / -1';
        card.style.border = '2px solid var(--accent-border)';
        card.style.background = '#FFFFFF';
        card.style.boxShadow = 'var(--shadow-card)';

        card.innerHTML = `
          <div class="washer-card-top" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 14px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <div class="washer-avatar-large" style="width: 52px; height: 52px; font-size: 1.3rem; background: var(--accent-primary); color: #fff;">${myProfile.name.charAt(0)}</div>
              <div>
                <strong style="font-size: 1.15rem; color: var(--text-title);">${myProfile.name}</strong>
                <p style="font-size: 0.78rem; color: var(--text-muted);">${myProfile.phone || 'Operario en Turno'}</p>
              </div>
            </div>
            <span class="washer-status-pill" style="background: var(--status-success-bg); color: var(--status-success); font-weight: 700;">Turno Activo</span>
          </div>

          <div class="washer-stats-row" style="margin: 18px 0; background: var(--bg-canvas); padding: 16px; border-radius: var(--radius-md); display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 14px;">
            <div>
              <span class="caja-stat-label">Vehículos Entregados</span>
              <strong class="caja-stat-value" style="font-size: 1.45rem; color: var(--text-title);">${myDeliveredOrders.length}</strong>
            </div>
            <div>
              <span class="caja-stat-label">En Bahía / Espera</span>
              <strong class="caja-stat-value" style="font-size: 1.45rem; color: var(--status-warning);">${myActiveOrders.length}</strong>
            </div>
            <div>
              <span class="caja-stat-label">Tus Ganancias Acumuladas</span>
              <strong class="caja-stat-value" style="font-size: 1.45rem; color: var(--accent-primary); font-family: var(--font-mono);">${formatCOP(myTotalCommission)}</strong>
            </div>
          </div>

          <div style="margin-top: 16px;">
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-title); margin-bottom: 10px;">Detalle de tus Servicios de Hoy</h4>
            ${myDeliveredOrders.length === 0 ? `
              <p style="font-size: 0.8rem; color: var(--text-muted); padding: 14px 0; text-align: center; background: var(--bg-canvas); border-radius: var(--radius-sm);">No tienes vehículos entregados hoy. Conforme finalices lavados en tu turno, verás tus comisiones aquí.</p>
            ` : `
              <div style="overflow-x: auto;">
                <table class="ui-table" style="font-size: 0.84rem;">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Servicio Realizado</th>
                      <th>Tipo</th>
                      <th style="text-align: right;">Tu Comisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${myDeliveredOrders.map(o => `
                      <tr>
                        <td><span class="colombian-plate" style="font-size:0.75rem; padding: 2px 6px;">${o.plate}</span></td>
                        <td style="font-weight: 600;">${o.serviceName}</td>
                        <td><span style="font-size:0.75rem; text-transform:capitalize;">${o.vehicleType}</span></td>
                        <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: var(--accent-primary);">${formatCOP(o.commission || 0)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <div style="margin-top: 18px; padding: 10px 14px; background: var(--accent-subtle); border: 1px solid var(--accent-border); border-radius: var(--radius-sm); font-size: 0.74rem; color: var(--text-muted); text-align: center;">
            Los ingresos de tus compañeros y los totales del autolavado son privados.
          </div>
        `;

        grid.appendChild(card);
        return;
      }

      // =========================================================================
      // MODO ADMIN / CAJERO: Liquidación de todos los operarios
      // =========================================================================
      if (viewTitle) viewTitle.textContent = 'Liquidación de Operarios';
      if (viewSubtitle) viewSubtitle.textContent = 'Cálculo automático de comisiones y control del equipo de trabajo.';
      if (btnNewWasher) btnNewWasher.style.display = appState.currentRole === 'admin' ? 'inline-flex' : 'none';

      appState.washers.forEach(w => {
        const washerOrders = appState.orders.filter(o => o.washerId === w.id);
        const totalComm = washerOrders.reduce((sum, o) => sum + (o.commission || 0), 0);

        const card = document.createElement('div');
        card.className = 'washer-profile-card';
        card.innerHTML = `
          <div class="washer-card-top">
            <div style="display:flex; align-items:center; gap:12px;">
              <div class="washer-avatar-large">${w.name.charAt(0)}</div>
              <div>
                <strong style="font-size: 0.95rem;">${w.name}</strong>
                <p style="font-size: 0.75rem; color: var(--text-muted);">${w.phone || 'Sin celular'}</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="washer-status-pill" style="${w.active ? '' : 'background:#F1F5F9; color:#64748B;'}">${w.active ? 'Activo' : 'Inactivo'}</span>
              ${appState.currentRole === 'admin' ? `
                <button class="btn-admin-icon" title="Editar Operario" onclick="openEditWasherModal('${w.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                <button class="btn-admin-icon danger" title="Eliminar Operario" onclick="deleteWasher('${w.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              ` : ''}
            </div>
          </div>
          <div class="washer-stats-row">
            <div>
              <span class="caja-stat-label">Autos Lavados</span>
              <div class="table-num">${washerOrders.length}</div>
            </div>
            <div>
              <span class="caja-stat-label">Comisión Total</span>
              <div class="table-num" style="color: var(--accent-primary);">${formatCOP(totalComm)}</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-card-action" style="flex: 1;" onclick="settleWasherCommission('${w.id}', '${w.name}', ${totalComm})">
              Pagar Liquidación
            </button>
            ${appState.currentRole === 'admin' ? `
              <button class="btn-card-action" onclick="toggleWasherActive('${w.id}')">
                ${w.active ? 'Pausar' : 'Reactivar'}
              </button>
            ` : ''}
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function openNewWasherModal() {
      if (appState.currentRole === 'operario' || appState.currentRole === 'lavador') {
        alert('Acceso restringido: solo el administrador puede registrar operarios.');
        return;
      }
      document.getElementById('washerEditId').value = '';
      document.getElementById('modalWasherTitle').textContent = 'Nuevo Operario';
      document.getElementById('washerNameInput').value = '';
      document.getElementById('washerPhoneInput').value = '';
      document.getElementById('washerPinInput').value = '1111';
      document.getElementById('washerActiveStatusSelect').value = 'true';
      document.getElementById('btnDeleteWasherInModal').style.display = 'none';
      openModal('modalWasher');
    }

    function openEditWasherModal(wId) {
      if (appState.currentRole === 'operario' || appState.currentRole === 'lavador') {
        alert('Acceso restringido: no tienes permisos para editar operarios.');
        return;
      }
      const washer = appState.washers.find(w => w.id === wId);
      if (!washer) return;

      document.getElementById('washerEditId').value = washer.id;
      document.getElementById('modalWasherTitle').textContent = 'Editar Operario';
      document.getElementById('washerNameInput').value = washer.name;
      document.getElementById('washerPhoneInput').value = washer.phone || '';
      document.getElementById('washerPinInput').value = washer.pin || '1111';
      document.getElementById('washerActiveStatusSelect').value = String(washer.active !== false);
      document.getElementById('btnDeleteWasherInModal').style.display = 'block';
      openModal('modalWasher');
    }

    function saveWasher() {
      if (appState.currentRole === 'operario' || appState.currentRole === 'lavador') {
        alert('Acceso restringido: no tienes permisos para crear o modificar operarios.');
        return;
      }
      const editId = document.getElementById('washerEditId').value;
      const name = document.getElementById('washerNameInput').value.trim();
      const phone = document.getElementById('washerPhoneInput').value.trim();
      const pin = document.getElementById('washerPinInput').value.trim() || '1111';
      const active = document.getElementById('washerActiveStatusSelect').value === 'true';

      if (!name) {
        alert('Ingrese el nombre del operario');
        return;
      }

      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        alert('El PIN personal debe ser de exactamente 4 dígitos numéricos.');
        return;
      }

      if (editId) {
        const washer = appState.washers.find(w => w.id === editId);
        if (washer) {
          washer.name = name;
          washer.phone = phone;
          washer.pin = pin;
          washer.active = active;
        }
      } else {
        appState.washers.push({
          id: 'w_' + Date.now(),
          name: name,
          phone: phone,
          pin: pin,
          active: active
        });
      }

      saveToStorage();
      closeModal('modalWasher');
      renderAllViews();
    }

    async function deleteWasher(wId) {
      if (appState.currentRole === 'operario' || appState.currentRole === 'lavador') {
        showToast('Acceso restringido: no tienes permisos para eliminar operarios.', 'error');
        return;
      }
      const washer = appState.washers.find(w => w.id === wId);
      if (!washer) return;
      const confirmed = await showConfirmDialog({
        title: '¿Eliminar a ' + washer.name + '?',
        message: 'El operario será retirado de la lista activa del autolavado.',
        confirmText: 'Eliminar Operario',
        cancelText: 'Cancelar',
        type: 'danger'
      });
      if (confirmed) {
        appState.washers = appState.washers.filter(w => w.id !== wId);
        saveToStorage();
        renderAllViews();
        showToast('Operario ' + washer.name + ' eliminado.', 'info');
      }
    }

    function deleteWasherFromModal() {
      if (appState.currentRole === 'operario' || appState.currentRole === 'lavador') return;
      const wId = document.getElementById('washerEditId').value;
      if (wId) {
        deleteWasher(wId);
        closeModal('modalWasher');
      }
    }

    function toggleWasherActive(wId) {
      if (appState.currentRole === 'operario' || appState.currentRole === 'lavador') return;
      const washer = appState.washers.find(w => w.id === wId);
      if (washer) {
        washer.active = !washer.active;
        saveToStorage();
        renderAllViews();
      }
    }

    async function settleWasherCommission(wId, name, amount) {
      if (appState.currentRole === 'operario' || appState.currentRole === 'lavador') {
        showToast('Acceso restringido: solo el administrador o cajero puede liquidar pagos.', 'error');
        return;
      }
      if (amount <= 0) {
        showToast(name + ' no tiene comisiones acumuladas hoy.', 'warning');
        return;
      }
      const confirmed = await showConfirmDialog({
        title: '¿Confirmar liquidación?',
        message: 'Se registrará el desembolso de ' + formatCOP(amount) + ' a ' + name + ' como pago completado.',
        confirmText: 'Confirmar Liquidación',
        cancelText: 'Cancelar',
        type: 'primary'
      });
      if (confirmed) {
        showToast('Liquidación de ' + formatCOP(amount) + ' pagada exitosamente a ' + name + '.', 'success');
      }
    }

    // ================= HISTORIAL DE SERVICIOS =================