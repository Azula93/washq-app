/**
 * WashQ / KodiQuett — Vista de Historial y Auditoría
 * Búsqueda de vehículos por placa, filtros por fecha y exportación de reportes.
 */

    function renderHistory(filterText = '') {
      const tbody = document.getElementById('historyTableBody');
      tbody.innerHTML = '';
      const filter = filterText.toLowerCase();

      appState.orders.filter(o => {
        return o.plate.toLowerCase().includes(filter) ||
               o.serviceName.toLowerCase().includes(filter) ||
               (o.washerName && o.washerName.toLowerCase().includes(filter));
      }).forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${o.ticketNumber}</strong></td>
          <td><span class="colombian-plate">${o.plate}</span></td>
          <td style="text-transform: capitalize;">${o.vehicleType}</td>
          <td>${o.serviceName}</td>
          <td>${o.washerName || 'Por asignar'}</td>
          <td class="table-num">${formatCOP(o.price)}</td>
          <td>${o.paymentMethod || 'Pendiente'}</td>
          <td><span class="queue-status-tag ${o.status === 'entregado' ? 'tag-ready' : 'tag-washing'}">${o.status}</span></td>
          <td style="text-align: right;">
            <button class="btn-admin-icon" title="Editar orden" onclick="openEditOrderModal('${o.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            <button class="btn-admin-icon danger" title="Eliminar orden" onclick="deleteOrderById('${o.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            <button class="btn-card-action" style="padding: 2px 7px;" onclick="viewOrderTicket('${o.id}')">Ticket</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function filterHistory() {
      const txt = document.getElementById('historySearchInput').value;
      renderHistory(txt);
    }

    function exportHistoryExcel() {
      if (!appState.orders || appState.orders.length === 0) {
        alert('No hay órdenes registradas para exportar.');
        return;
      }

      if (typeof XLSX !== 'undefined') {
        const rows = appState.orders.map(o => {
          const d = o.createdAt ? new Date(o.createdAt) : new Date();
          const fechaStr = d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
          const horaStr = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
          const precio = Number(o.price) || 0;
          const comision = Number(o.commission) || 0;
          const ganancia = precio - comision;

          return {
            'Ticket': o.ticketNumber || '',
            'Fecha': fechaStr,
            'Hora': horaStr,
            'Placa': (o.plate || '').toUpperCase(),
            'Tipo Vehículo': (o.vehicleType || '').toUpperCase(),
            'Servicio': o.serviceName || '',
            'Operario': o.washerName || 'Sin asignar',
            'Precio (COP)': precio,
            'Comisión (COP)': comision,
            'Ganancia Neta (COP)': ganancia,
            'Método Pago': o.paymentMethod || 'Pendiente',
            'Estado': (o.status || '').toUpperCase(),
            'Teléfono': o.phone || '',
            'Observaciones': o.notes || ''
          };
        });

        const ws = XLSX.utils.json_to_sheet(rows);

        // Anchos de columna óptimos para visualización inmediata en Excel
        ws['!cols'] = [
          { wch: 8 },  // Ticket
          { wch: 12 }, // Fecha
          { wch: 10 }, // Hora
          { wch: 12 }, // Placa
          { wch: 14 }, // Tipo Vehículo
          { wch: 34 }, // Servicio
          { wch: 22 }, // Operario
          { wch: 15 }, // Precio COP
          { wch: 15 }, // Comisión COP
          { wch: 18 }, // Ganancia Neta COP
          { wch: 16 }, // Método Pago
          { wch: 12 }, // Estado
          { wch: 14 }, // Teléfono
          { wch: 28 }  // Observaciones
        ];

        // Formato contable/moneda para columnas numéricas
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = 1; R <= range.e.r; ++R) {
          [7, 8, 9].forEach(C => {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell && typeof cell.v === 'number') cell.z = '"$"#,##0';
          });
        }

        // Activar filtros automáticos en encabezados para buscar y filtrar en Excel
        ws['!autofilter'] = { ref: ws['!ref'] };

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Historial_Servicios');

        const fechaHoy = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `WashQ_Historial_${fechaHoy}.xlsx`);
        return;
      }

      exportHistoryCSVFallback();
    }

    function exportHistoryCSVFallback() {
      let csv = 'Ticket;Fecha;Hora;Placa;Tipo;Servicio;Operario;Precio COP;Comision COP;Ganancia COP;Metodo;Estado;Telefono;Notas\n';
      appState.orders.forEach(o => {
        const d = o.createdAt ? new Date(o.createdAt) : new Date();
        const fStr = d.toLocaleDateString('es-CO');
        const hStr = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const precio = Number(o.price) || 0;
        const comision = Number(o.commission) || 0;
        const ganancia = precio - comision;
        const srv = (o.serviceName || '').replace(/;/g, ' ');
        const op = (o.washerName || 'Sin asignar').replace(/;/g, ' ');
        const notas = (o.notes || '').replace(/;/g, ' ');
        csv += `${o.ticketNumber};${fStr};${hStr};${(o.plate || '').toUpperCase()};${o.vehicleType};"${srv}";"${op}";${precio};${comision};${ganancia};${o.paymentMethod || 'Pendiente'};${o.status};${o.phone || ''};"${notas}"\n`;
      });
      downloadCSV(csv, 'Historial_WashQ.csv');
    }

    function exportHistoryCSV() {
      exportHistoryExcel();
    }

    // ================= SERVICIOS Y TARIFAS (CONTROL TOTAL) =================