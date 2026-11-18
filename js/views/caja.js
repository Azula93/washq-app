/**
 * WashQ / KodiQuett — Vista de Caja y Arqueo
 * Cuadre diario, registro de egresos, reporte para WhatsApp del dueño y exportación a Excel.
 */

    function renderCaja() {
      // Filtrar estrictamente la jornada de HOY para el cuadre diario
      const todayOrders = (appState.orders || []).filter(isOrderToday);
      const todayExpenses = (appState.expenses || []).filter(isExpenseToday);

      const totalIngresos = todayOrders.reduce((sum, o) => sum + (o.price || 0), 0);
      const totalComisiones = todayOrders.reduce((sum, o) => sum + (o.commission || 0), 0);
      const totalGastos = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const neto = totalIngresos - totalComisiones - totalGastos;

      document.getElementById('cajaTotalIngresos').textContent = formatCOP(totalIngresos);
      document.getElementById('cajaTotalComisiones').textContent = formatCOP(totalComisiones);
      document.getElementById('cajaTotalGastos').textContent = formatCOP(totalGastos);
      document.getElementById('cajaNeto').textContent = formatCOP(neto);

      const pmContainer = document.getElementById('cajaPaymentMethodsBreakdown');
      if (pmContainer) {
        pmContainer.innerHTML = '';
        const grandTotal = todayOrders.reduce((sum, o) => sum + (o.price || 0), 0);

        (appState.paymentMethods || []).forEach(pm => {
          const meta = getPaymentMethodMeta(pm);
          const pmOrders = todayOrders.filter(o => {
            if (!o.paymentMethod) return false;
            const p = String(o.paymentMethod).toLowerCase();
            return p === pm.id.toLowerCase() || 
                   p === (pm.name || '').toLowerCase() || 
                   p === pm.id.replace('pm_', '').toLowerCase() ||
                   p.includes(meta.key);
          });
          const total = pmOrders.reduce((sum, o) => sum + (o.price || 0), 0);
          const pct = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(0) : 0;

          const row = document.createElement('div');
          row.className = 'payment-row';
          row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-subtle);';
          row.innerHTML = `
            <div class="payment-row-left" style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${meta.color}; display: inline-block; flex-shrink: 0;"></span>
              <span style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; background: ${meta.bg}; flex-shrink: 0;">${meta.iconSvg}</span>
              <span style="font-weight: 600; font-size: 0.88rem; color: var(--text-title);">${pm.name}</span>
              <span style="font-size: 0.74rem; color: var(--text-muted);">(${pmOrders.length} pagos)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="payment-row-val" style="font-weight: 700; font-family: var(--font-mono); font-size: 0.92rem; color: var(--text-title);">${formatCOP(total)}</span>
              <span style="font-size: 0.72rem; font-weight: 700; color: ${total > 0 ? meta.color : 'var(--text-muted)'}; background: ${total > 0 ? meta.bg : 'var(--bg-surface-subtle)'}; padding: 2px 7px; border-radius: 10px; min-width: 36px; text-align: center;">${pct}%</span>
            </div>
          `;
          pmContainer.appendChild(row);
        });
      }

      const expensesBody = document.getElementById('expensesTableBody');
      if (expensesBody) {
        expensesBody.innerHTML = '';
        todayExpenses.forEach(e => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${e.desc}</strong></td>
            <td><span class="queue-status-tag tag-waiting">${e.category}</span></td>
            <td class="table-num" style="color: var(--status-danger); font-weight: 700;">-${formatCOP(e.amount)}</td>
            <td style="text-align: right;">
              <button class="btn-admin-icon" title="Editar gasto" onclick="openEditExpenseModal('${e.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
              <button class="btn-admin-icon danger" title="Eliminar gasto" onclick="deleteExpense('${e.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </td>
          `;
          expensesBody.appendChild(tr);
        });
      }
    }

    function populateExpenseCategoriesDropdown(selectedCat = '') {
      const select = document.getElementById('expenseCategory');
      select.innerHTML = '';
      appState.expenseCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (cat === selectedCat) opt.selected = true;
        select.appendChild(opt);
      });
    }

    function openExpenseModal() {
      document.getElementById('expenseEditId').value = '';
      document.getElementById('modalExpenseTitle').textContent = 'Registrar Gasto de Caja';
      document.getElementById('expenseDescription').value = '';
      document.getElementById('expenseAmount').value = '';
      document.getElementById('btnDeleteExpenseInModal').style.display = 'none';
      populateExpenseCategoriesDropdown();
      openModal('modalExpense');
    }

    function openEditExpenseModal(expId) {
      const exp = appState.expenses.find(e => e.id === expId);
      if (!exp) return;

      document.getElementById('expenseEditId').value = exp.id;
      document.getElementById('modalExpenseTitle').textContent = 'Editar Gasto de Caja';
      document.getElementById('expenseDescription').value = exp.desc;
      document.getElementById('expenseAmount').value = exp.amount;
      document.getElementById('btnDeleteExpenseInModal').style.display = 'block';
      populateExpenseCategoriesDropdown(exp.category);
      openModal('modalExpense');
    }

    function saveExpense() {
      const editId = document.getElementById('expenseEditId').value;
      const desc = document.getElementById('expenseDescription').value.trim();
      const cat = document.getElementById('expenseCategory').value;
      const amt = Number(document.getElementById('expenseAmount').value);

      if (!desc || !amt) {
        alert('Complete la descripción y el monto');
        return;
      }

      if (editId) {
        const exp = appState.expenses.find(e => e.id === editId);
        if (exp) {
          exp.desc = desc;
          exp.category = cat;
          exp.amount = amt;
        }
      } else {
        appState.expenses.unshift({
          id: 'exp_' + Date.now(),
          desc: desc,
          category: cat,
          amount: amt,
          date: Date.now()
        });
      }

      saveToStorage();
      closeModal('modalExpense');
      renderAllViews();
    }

    async function deleteExpense(expId) {
      const confirmed = await showConfirmDialog({
        title: '¿Eliminar gasto de caja?',
        message: 'Este gasto se descontará del historial de salidas de caja del día.',
        confirmText: 'Eliminar Gasto',
        cancelText: 'Cancelar',
        type: 'danger'
      });
      if (confirmed) {
        appState.expenses = appState.expenses.filter(e => e.id !== expId);
        saveToStorage();
        renderAllViews();
        showToast('Gasto eliminado de caja.', 'info');
      }
    }

    function deleteExpenseFromModal() {
      const expId = document.getElementById('expenseEditId').value;
      if (expId) {
        deleteExpense(expId);
        closeModal('modalExpense');
      }
    }

    // Gestión de Categorías de Gasto
    function openCategoryManagerModal() {
      renderCategoriesModalTable();
      openModal('modalCategories');
    }

    function renderCategoriesModalTable() {
      const tbody = document.getElementById('categoriesModalTableBody');
      tbody.innerHTML = '';
      appState.expenseCategories.forEach(cat => {
        const count = appState.expenses.filter(e => e.category === cat).length;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${cat}</strong> <small style="color:var(--text-muted);">(${count} gastos asociados)</small></td>
          <td style="text-align: right;">
            <button class="btn-admin-icon" onclick="promptEditCategory('${cat}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            <button class="btn-admin-icon danger" onclick="deleteCategory('${cat}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function promptNewCategory() {
      const name = prompt('Escribe el nombre del nuevo tipo de gasto (ej: Seguro, Arriendo, Nómina, etc.):');
      if (name && name.trim()) {
        const clean = name.trim();
        if (!appState.expenseCategories.includes(clean)) {
          appState.expenseCategories.push(clean);
          saveToStorage();
          populateExpenseCategoriesDropdown(clean);
          renderCategoriesModalTable();
          renderExpenseCategoriesConfig();
        }
      }
    }

    function addExpenseCategoryFromInput() {
      const input = document.getElementById('newCategoryInputName');
      const val = input.value.trim();
      if (!val) return;
      if (!appState.expenseCategories.includes(val)) {
        appState.expenseCategories.push(val);
        input.value = '';
        saveToStorage();
        renderCategoriesModalTable();
        renderExpenseCategoriesConfig();
        populateExpenseCategoriesDropdown();
      }
    }

    function promptEditCategory(oldCat) {
      const newCat = prompt(`Editar nombre de la categoría "${oldCat}":`, oldCat);
      if (newCat && newCat.trim() && newCat !== oldCat) {
        const clean = newCat.trim();
        const idx = appState.expenseCategories.indexOf(oldCat);
        if (idx !== -1) {
          appState.expenseCategories[idx] = clean;
          appState.expenses.forEach(e => {
            if (e.category === oldCat) e.category = clean;
          });
          saveToStorage();
          renderCategoriesModalTable();
          renderExpenseCategoriesConfig();
          renderAllViews();
        }
      }
    }

    async function deleteCategory(cat) {
      const confirmed = await showConfirmDialog({
        title: '¿Eliminar categoría?',
        message: '¿Estás seguro de eliminar la categoría "' + cat + '" de los gastos?',
        confirmText: 'Eliminar Categoría',
        cancelText: 'Cancelar',
        type: 'danger'
      });
      if (confirmed) {
        appState.expenseCategories = appState.expenseCategories.filter(c => c !== cat);
        saveToStorage();
        renderCategoriesModalTable();
        renderExpenseCategoriesConfig();
        renderAllViews();
        showToast('Categoría eliminada.', 'info');
      }
    }

    function renderExpenseCategoriesConfig() {
      const container = document.getElementById('configCategoriesList');
      if (!container) return;
      container.innerHTML = '';
      appState.expenseCategories.forEach(cat => {
        const pill = document.createElement('span');
        pill.className = 'queue-status-tag tag-waiting';
        pill.style.display = 'inline-flex';
        pill.style.alignItems = 'center';
        pill.style.gap = '6px';
        pill.style.padding = '4px 8px';
        pill.innerHTML = `
          <span>${cat}</span>
          <button style="border:none;background:transparent;cursor:pointer;color:var(--text-muted);" onclick="deleteCategory('${cat}')">&times;</button>
        `;
        container.appendChild(pill);
      });
    }

    function exportCajaReportExcel() {
      if (typeof XLSX !== 'undefined') {
        const fechaHoy = new Date().toISOString().slice(0, 10);

        // 1. Hoja de Ingresos por Servicios
        const ingresosRows = appState.orders.map(o => {
          const d = o.createdAt ? new Date(o.createdAt) : new Date();
          return {
            'Ticket': o.ticketNumber || '',
            'Fecha': d.toLocaleDateString('es-CO'),
            'Hora': d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            'Placa': (o.plate || '').toUpperCase(),
            'Servicio': o.serviceName || '',
            'Operario': o.washerName || 'Sin asignar',
            'Monto (COP)': Number(o.price) || 0,
            'Comisión (COP)': Number(o.commission) || 0,
            'Método de Pago': o.paymentMethod || 'Pendiente'
          };
        });

        // 2. Hoja de Gastos
        const gastosRows = (appState.expenses || []).map(e => ({
          'Concepto': e.desc || e.concept || '',
          'Categoría': e.category || 'General',
          'Monto (COP)': Number(e.amount) || 0
        }));

        // 3. Resumen Ejecutivo de Caja
        const totalIngresos = appState.orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
        const totalComisiones = appState.orders.reduce((sum, o) => sum + (Number(o.commission) || 0), 0);
        const totalGastos = (appState.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const balanceNeto = totalIngresos - totalComisiones - totalGastos;

        const resumenRows = [
          { 'Concepto': 'TOTAL INGRESOS (VENTAS)', 'Valor (COP)': totalIngresos },
          { 'Concepto': 'TOTAL COMISIONES OPERARIOS', 'Valor (COP)': totalComisiones },
          { 'Concepto': 'TOTAL GASTOS DE OPERACIÓN', 'Valor (COP)': totalGastos },
          { 'Concepto': 'BALANCE NETO DISPONIBLE', 'Valor (COP)': balanceNeto }
        ];

        const wb = XLSX.utils.book_new();

        const wsIngresos = XLSX.utils.json_to_sheet(ingresosRows.length ? ingresosRows : [{ Info: 'Sin ingresos registrados' }]);
        wsIngresos['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 32 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 16 }];
        if (ingresosRows.length) {
          wsIngresos['!autofilter'] = { ref: wsIngresos['!ref'] };
          const range = XLSX.utils.decode_range(wsIngresos['!ref']);
          for (let R = 1; R <= range.e.r; ++R) {
            [6, 7].forEach(C => {
              const cell = wsIngresos[XLSX.utils.encode_cell({ r: R, c: C })];
              if (cell && typeof cell.v === 'number') cell.z = '"$"#,##0';
            });
          }
        }
        XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos');

        const wsGastos = XLSX.utils.json_to_sheet(gastosRows.length ? gastosRows : [{ Info: 'Sin gastos registrados' }]);
        wsGastos['!cols'] = [{ wch: 32 }, { wch: 18 }, { wch: 15 }];
        if (gastosRows.length) {
          wsGastos['!autofilter'] = { ref: wsGastos['!ref'] };
          const range = XLSX.utils.decode_range(wsGastos['!ref']);
          for (let R = 1; R <= range.e.r; ++R) {
            const cell = wsGastos[XLSX.utils.encode_cell({ r: R, c: 2 })];
            if (cell && typeof cell.v === 'number') cell.z = '"$"#,##0';
          }
        }
        XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos');

        const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
        wsResumen['!cols'] = [{ wch: 35 }, { wch: 18 }];
        const rangeRes = XLSX.utils.decode_range(wsResumen['!ref']);
        for (let R = 1; R <= rangeRes.e.r; ++R) {
          const cell = wsResumen[XLSX.utils.encode_cell({ r: R, c: 1 })];
          if (cell && typeof cell.v === 'number') cell.z = '"$"#,##0';
        }
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen de Caja');

        XLSX.writeFile(wb, `WashQ_Cuadre_Caja_${fechaHoy}.xlsx`);
        return;
      }

      exportCajaReportCSVFallback();
    }

    function exportCajaReportCSVFallback() {
      let csv = 'Tipo;Concepto / Placa;Monto COP;Metodo / Categoria\n';
      appState.orders.forEach(o => {
        csv += `Ingreso;"${o.plate} - ${o.serviceName}";${o.price};${o.paymentMethod || 'Pendiente'}\n`;
      });
      (appState.expenses || []).forEach(e => {
        csv += `Gasto;"${e.desc || e.concept || ''}";-${e.amount};${e.category}\n`;
      });
      downloadCSV(csv, 'Cuadre_Caja_WashQ.csv');
    }

    function exportCajaReportCSV() {
      exportCajaReportExcel();
    }

    // ================= OPERARIOS (CONTROL TOTAL: CREAR, EDITAR, ELIMINAR) =================

    function sendCajaReportWhatsApp() {
      const biz = appState.config;
      const ownerPhone = (biz.ownerPhone || '').replace(/\D/g, '');

      const todayStr = new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
      const timeStr = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

      const totalVehiculos = appState.orders.length;
      const totalIngresos = appState.orders.reduce((sum, o) => sum + (o.price || 0), 0);
      const totalComisiones = appState.orders.reduce((sum, o) => sum + (o.commission || 0), 0);
      const totalGastos = appState.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      // Desglose por método de pago
      let pmBreakdown = '';
      let efectivoCobrado = 0;
      appState.paymentMethods.forEach(pm => {
        const pmOrders = appState.orders.filter(o => o.paymentMethod === pm.id);
        const pmTotal = pmOrders.reduce((sum, o) => sum + (o.price || 0), 0);
        if (pm.id === 'pm_efectivo') efectivoCobrado = pmTotal;
        if (pmTotal > 0 || pmOrders.length > 0) {
          pmBreakdown += `- ${pm.name}: ${formatCOP(pmTotal)} (${pmOrders.length} pagos)\n`;
        }
      });

      // Desglose por operario
      let washersBreakdown = '';
      appState.washers.forEach(w => {
        const wOrders = appState.orders.filter(o => o.washerId === w.id);
        const wComm = wOrders.reduce((sum, o) => sum + (o.commission || 0), 0);
        if (wOrders.length > 0) {
          washersBreakdown += `- ${w.name}: ${formatCOP(wComm)} (${wOrders.length} vehíc.)\n`;
        }
      });
      if (!washersBreakdown) washersBreakdown = '• Sin comisiones liquidadas hoy\n';

      // Desglose de gastos
      let expensesBreakdown = '';
      appState.expenses.forEach(e => {
        expensesBreakdown += `- ${e.desc}: ${formatCOP(e.amount)} (${e.category})\n`;
      });
      if (!expensesBreakdown) expensesBreakdown = '• Sin gastos registrados\n';

      const netoEnCaja = totalIngresos - totalComisiones - totalGastos;
      const efectivoFisicoCajon = efectivoCobrado - totalComisiones - totalGastos;

      const cleanBizName = biz.businessName.replace(/&bull;/g, '•');

      const msg = 
`*REPORTE DIARIO DE CAJA - ${cleanBizName.toUpperCase()}*\nFecha: ${todayStr} | ${timeStr}\n----------------------------------------\n*Vehículos Atendidos:* ${totalVehiculos}\n*Total Facturado:* ${formatCOP(totalIngresos)}\n\n*RECAUDO POR CANALES:*\n${pmBreakdown}\n*LIQUIDACIÓN DE OPERARIOS:*\n${washersBreakdown}\n*SALIDAS Y GASTOS DE CAJA:*\n${expensesBreakdown}\n----------------------------------------\n*EFECTIVO EN CAJÓN:* *${formatCOP(efectivoFisicoCajon)}*\n*BALANCE NETO DEL DÍA:* *${formatCOP(netoEnCaja)}*\n\n_Sistema WashQ - kodiquett.com/washq_`;

      const targetPhone = ownerPhone ? (ownerPhone.startsWith('57') ? ownerPhone : '57' + ownerPhone) : '';
      const url = targetPhone 
        ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;

      window.open(url, '_blank');
    }
