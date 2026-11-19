/**
 * WashQ / KodiQuett — Vista de Configuración del Negocio
 * Catálogo de servicios y tarifas, medios de pago, backup y especialización de sede.
 */

    function renderServicesConfig() {
      const tbody = document.getElementById('servicesConfigTableBody');
      tbody.innerHTML = '';
      appState.services.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="text-transform: capitalize;">${s.type}</td>
          <td><strong>${s.name}</strong></td>
          <td class="table-num">${formatCOP(s.price)}</td>
          <td>${s.duration} min</td>
          <td style="text-align: right;">
            <button class="btn-admin-icon" title="Editar servicio" onclick="openEditServiceModal('${s.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            <button class="btn-admin-icon danger" title="Eliminar servicio" onclick="deleteService('${s.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function openNewServiceModal() {
      document.getElementById('serviceEditId').value = '';
      document.getElementById('modalServiceTitle').textContent = 'Nueva Tarifa de Servicio';
      document.getElementById('serviceNameInput').value = '';
      document.getElementById('servicePriceInput').value = '';
      document.getElementById('serviceDurationInput').value = '30';
      document.getElementById('serviceCommissionVal').value = '40';
      document.getElementById('btnDeleteServiceInModal').style.display = 'none';
      openModal('modalService');
    }

    function openEditServiceModal(sId) {
      const service = appState.services.find(s => s.id === sId);
      if (!service) return;

      document.getElementById('serviceEditId').value = service.id;
      document.getElementById('modalServiceTitle').textContent = 'Editar Tarifa de Servicio';
      document.getElementById('serviceTypeSelect').value = service.type;
      document.getElementById('serviceNameInput').value = service.name;
      document.getElementById('servicePriceInput').value = service.price;
      document.getElementById('serviceDurationInput').value = service.duration;
      document.getElementById('serviceCommissionType').value = service.commType;
      document.getElementById('serviceCommissionVal').value = service.commVal;
      document.getElementById('btnDeleteServiceInModal').style.display = 'block';
      openModal('modalService');
    }

    function saveServiceConfig() {
      const editId = document.getElementById('serviceEditId').value;
      const type = document.getElementById('serviceTypeSelect').value;
      const name = document.getElementById('serviceNameInput').value.trim();
      const price = Number(document.getElementById('servicePriceInput').value);
      const duration = Number(document.getElementById('serviceDurationInput').value);
      const commType = document.getElementById('serviceCommissionType').value;
      const commVal = Number(document.getElementById('serviceCommissionVal').value);

      if (!name || !price) {
        alert('Complete el nombre y el precio');
        return;
      }

      if (editId) {
        const service = appState.services.find(s => s.id === editId);
        if (service) {
          service.type = type;
          service.name = name;
          service.price = price;
          service.duration = duration;
          service.commType = commType;
          service.commVal = commVal;
        }
      } else {
        appState.services.push({
          id: 's_' + Date.now(),
          type, name, price, duration, commType, commVal
        });
      }

      saveToStorage();
      closeModal('modalService');
      renderAllViews();
    }

    async function deleteService(sId) {
      const service = appState.services.find(s => s.id === sId);
      if (!service) return;
      const confirmed = await showConfirmDialog({
        title: '¿Eliminar servicio?',
        message: '¿Estás seguro de retirar "' + service.name + '" del catálogo de servicios?',
        confirmText: 'Eliminar Servicio',
        cancelText: 'Cancelar',
        type: 'danger'
      });
      if (confirmed) {
        appState.services = appState.services.filter(s => s.id !== sId);
        saveToStorage();
        renderAllViews();
        showToast('Servicio eliminado.', 'info');
      }
    }

    function deleteServiceFromModal() {
      const sId = document.getElementById('serviceEditId').value;
      if (sId) {
        deleteService(sId);
        closeModal('modalService');
      }
    }

    // ================= MÉTODOS DE PAGO (CONTROL TOTAL) =================
    function renderPaymentMethodsConfig() {
      const tbody = document.getElementById('configPaymentMethodsTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';
      appState.paymentMethods.forEach(pm => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span class="role-badge" style="font-size: 0.75rem; text-transform: uppercase;">${pm.id.replace("pm_", "")}</span></td>
          <td><strong>${pm.name}</strong></td>
          <td style="text-align: right;">
            <button class="btn-admin-icon" title="Editar método" onclick="promptEditPaymentMethod('${pm.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            <button class="btn-admin-icon danger" title="Eliminar método" onclick="deletePaymentMethod('${pm.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function promptNewPaymentMethod() {
      const name = prompt('Nombre del nuevo método de pago (ej: Tarjeta Débito, PSE, etc.):');
      if (!name || !name.trim()) return;
      const icon = 'tarjeta';

      appState.paymentMethods.push({
        id: 'pm_' + Date.now(),
        name: name.trim(),
        icon: icon.trim()
      });
      saveToStorage();
      renderAllViews();
    }

    function promptEditPaymentMethod(pmId) {
      const pm = appState.paymentMethods.find(p => p.id === pmId);
      if (!pm) return;
      const newName = prompt('Editar nombre del método de pago:', pm.name);
      if (!newName || !newName.trim()) return;
      const newIcon = prompt('Editar ícono / emoji:', pm.icon) || pm.icon;

      pm.name = newName.trim();
      pm.icon = newIcon.trim();
      saveToStorage();
      renderAllViews();
    }

    async function deletePaymentMethod(pmId) {
      const pm = appState.paymentMethods.find(p => p.id === pmId);
      if (!pm) return;
      const confirmed = await showConfirmDialog({
        title: '¿Eliminar método de pago?',
        message: '¿Deseas retirar "' + pm.name + '" de las opciones de cobro?',
        confirmText: 'Eliminar Método',
        cancelText: 'Cancelar',
        type: 'danger'
      });
      if (confirmed) {
        appState.paymentMethods = appState.paymentMethods.filter(p => p.id !== pmId);
        saveToStorage();
        renderAllViews();
        showToast('Método de pago retirado.', 'info');
      }
    }

    // ================= CONFIGURACIÓN DEL NEGOCIO =================
    function renderBusinessConfig() {
      document.getElementById('configBizName').value = appState.config.businessName.replace('&bull;', '•');
      const washTypeSel = document.getElementById('configWashType');
      if (washTypeSel) {
        washTypeSel.value = appState.config.washType || (activeTenant && activeTenant.washType) || 'mixto';
      }
      document.getElementById('configBizAddress').value = appState.config.address;
      document.getElementById('configBizPhone').value = appState.config.phone;
      const ownerInput = document.getElementById('configBizOwnerPhone');
      if (ownerInput) ownerInput.value = appState.config.ownerPhone || '';
      document.getElementById('configBizFooter').value = appState.config.footerText;

      const lockSel = document.getElementById('configLockTimeout');
      if (lockSel) {
        const timeout = typeof appState.config.lockTimeoutMinutes === 'number' ? appState.config.lockTimeoutMinutes : 5;
        lockSel.value = String(timeout);
      }

      const openHourSel = document.getElementById('configOpenHour');
      const closeHourSel = document.getElementById('configCloseHour');
      if (openHourSel) {
        openHourSel.value = String(typeof appState.config.openHour === 'number' ? appState.config.openHour : 8);
      }
      if (closeHourSel) {
        closeHourSel.value = String(typeof appState.config.closeHour === 'number' ? appState.config.closeHour : 17);
      }

      renderAdminSedesList();
      renderLicenseInfo();
    }

    function saveBusinessConfig() {
      const openHourSel = document.getElementById('configOpenHour');
      const closeHourSel = document.getElementById('configCloseHour');
      if (openHourSel && closeHourSel) {
        const openH = Number(openHourSel.value);
        const closeH = Number(closeHourSel.value);
        if (closeH <= openH) {
          showToast('La hora de cierre debe ser posterior a la hora de apertura.', 'warning');
          return;
        }
        appState.config.openHour = openH;
        appState.config.closeHour = closeH;
      }

      appState.config.businessName = document.getElementById('configBizName').value.trim();
      const washTypeSel = document.getElementById('configWashType');
      if (washTypeSel) {
        const wt = washTypeSel.value;
        appState.config.washType = wt;
        if (activeTenant) {
          activeTenant.washType = wt;
          const tIdx = tenantsRegistry.findIndex(t => t.id === activeTenant.id);
          if (tIdx !== -1) {
            tenantsRegistry[tIdx].washType = wt;
            localStorage.setItem('washq_tenants_registry', JSON.stringify(tenantsRegistry));
          }
        }
      }
      appState.config.address = document.getElementById('configBizAddress').value.trim();
      appState.config.phone = document.getElementById('configBizPhone').value.trim();
      const ownerInput = document.getElementById('configBizOwnerPhone');
      if (ownerInput) appState.config.ownerPhone = ownerInput.value.trim();
      appState.config.footerText = document.getElementById('configBizFooter').value.trim();

      const lockSel = document.getElementById('configLockTimeout');
      if (lockSel) {
        appState.config.lockTimeoutMinutes = Number(lockSel.value);
      }

      saveToStorage();
      renderAdminSedesList();
      if (typeof renderOverview === 'function') renderOverview();
      showToast('Configuración guardada exitosamente.', 'success');
    }

    function exportBackupJSON() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Backup_WashQ_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    function importBackupJSON(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async function(e) {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed && Array.isArray(parsed.services) && Array.isArray(parsed.orders)) {
            const confirmed = await showConfirmDialog({
              title: '¿Restaurar copia de seguridad?',
              message: 'Se reemplazarán los datos actuales del autolavado con la información del archivo seleccionado.',
              confirmText: 'Restaurar Datos',
              cancelText: 'Cancelar',
              type: 'warning'
            });
            if (confirmed) {
              appState = { ...appState, ...parsed };
              saveToStorage();
              renderAllViews();
              showToast('Copia de seguridad restaurada exitosamente.', 'success');
            }
          } else {
            showToast('El archivo seleccionado no tiene el formato válido de respaldo de WashQ.', 'error');
          }
        } catch (err) {
          showToast('Error al leer el archivo de copia: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    async function resetDemoData() {
      const confirmed = await showConfirmDialog({
        title: '¿Restablecer datos de fábrica?',
        message: 'Se borrarán los cambios locales y el sistema volverá a sus datos iniciales de demostración.',
        confirmText: 'Restablecer Todo',
        cancelText: 'Cancelar',
        type: 'danger'
      });
      if (confirmed) {
        localStorage.removeItem('washq_cali_db');
        if (appState.tenantId) {
          localStorage.removeItem(getTenantStorageKey(appState.tenantId));
        }
        location.reload();
      }
    }

    // ================= CORTE DE CAJA POR WHATSAPP AL DUEÑO =================