/**
 * WashQ / KodiQuett — Vista de Patio y Zona de Lavado
 * Tablero Kanban en tiempo real, control de bahías, avance de estados y alertas de demora.
 */

    function renderKanban() {
      const cols = {
        'espera': document.getElementById('cards-espera'),
        'lavando': document.getElementById('cards-lavando'),
        'listo': document.getElementById('cards-listo'),
        'entregado': document.getElementById('cards-entregado')
      };

      Object.values(cols).forEach(col => col.innerHTML = '');
      const counts = { 'espera': 0, 'lavando': 0, 'listo': 0, 'entregado': 0 };

      const isOperario = appState.currentRole === 'operario' || appState.currentRole === 'lavador';
      const myWasherId = appState.currentWasherId;

      // Actualizar contadores del filtro de bahías para operarios
      if (isOperario) {
        const myOrders = appState.orders.filter(o => o.washerId === myWasherId);
        const btnMine = document.getElementById('btnFilterMyCars');
        const btnAll = document.getElementById('btnFilterAllCars');
        if (btnMine) btnMine.textContent = `⭐ Mis Asignados (${myOrders.length})`;
        if (btnAll) btnAll.textContent = `Toda la Zona (${appState.orders.length})`;
      }

      appState.orders.forEach(order => {
        counts[order.status] = (counts[order.status] || 0) + 1;

        // Si el operario tiene activo el filtro 'mine', solo muestra sus vehículos asignados
        if (isOperario && appState.patioFilter === 'mine' && order.washerId !== myWasherId) {
          return;
        }

        const card = createOrderCard(order);
        if (cols[order.status]) {
          cols[order.status].appendChild(card);
        }
      });

      document.getElementById('count-espera').textContent = counts['espera'] || 0;
      document.getElementById('count-lavando').textContent = counts['lavando'] || 0;
      document.getElementById('count-listo').textContent = counts['listo'] || 0;
      document.getElementById('count-entregado').textContent = counts['entregado'] || 0;
    }

    function togglePatioFilter(mode) {
      appState.patioFilter = mode;
      const btnMine = document.getElementById('btnFilterMyCars');
      const btnAll = document.getElementById('btnFilterAllCars');
      if (mode === 'mine') {
        if (btnMine) {
          btnMine.style.background = 'var(--color-obsidian)';
          btnMine.style.color = '#fff';
          btnMine.style.borderColor = 'var(--color-obsidian)';
        }
        if (btnAll) {
          btnAll.style.background = '';
          btnAll.style.color = '';
          btnAll.style.borderColor = '';
        }
      } else {
        if (btnAll) {
          btnAll.style.background = 'var(--color-obsidian)';
          btnAll.style.color = '#fff';
          btnAll.style.borderColor = 'var(--color-obsidian)';
        }
        if (btnMine) {
          btnMine.style.background = '';
          btnMine.style.color = '';
          btnMine.style.borderColor = '';
        }
      }
      renderKanban();
    }

    function createOrderCard(order) {
      const card = document.createElement('div');
      card.className = 'order-card';
      const elapsedMin = Math.floor((Date.now() - order.createdAt) / 60000);
      const isDelayed = order.status !== 'entregado' && elapsedMin > order.estimatedDuration;
      const isOperario = appState.currentRole === 'operario' || appState.currentRole === 'lavador';
      const isAssignedToMe = isOperario && order.washerId === appState.currentWasherId;

      if (isAssignedToMe) {
        card.style.borderColor = 'var(--accent-primary)';
        card.style.background = '#FFFFFF';
        card.style.boxShadow = '0 4px 14px var(--accent-glow)';
      }

      card.innerHTML = `
        <div class="card-row-top">
          <span class="colombian-plate">${order.plate}</span>
          <div class="card-top-admin-tools">
            ${isAssignedToMe ? `
              <span style="background:var(--accent-subtle); color:var(--accent-primary); font-size:0.68rem; font-weight:800; padding:2px 7px; border-radius:var(--radius-pill); border:1px solid var(--accent-border);">⭐ Asignado a Ti</span>
            ` : ''}
            <span class="card-meta-type">${order.vehicleType}</span>
            ${!isOperario ? `
              <button class="btn-admin-icon" title="Editar orden" onclick="openEditOrderModal('${order.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
              <button class="btn-admin-icon danger" title="Eliminar orden" onclick="deleteOrderById('${order.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            ` : ''}
          </div>
        </div>
        <div class="card-service-name">${order.serviceName}</div>
        <div class="card-washer-info">
          <span style="display:inline-flex; vertical-align:middle; margin-right:4px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>
          <span style="${isAssignedToMe ? 'font-weight:700; color:var(--accent-primary);' : ''}">${isAssignedToMe ? 'Asignado a Ti' : (order.washerName || 'Sin asignar')}</span>
        </div>
        <div class="card-timer-row">
          <span class="timer-badge ${isDelayed ? 'timer-delayed' : ''}">
            ⏱️ ${elapsedMin} min ${isDelayed ? '(Demorado)' : ''}
          </span>
          <span class="table-num">${!isOperario ? formatCOP(order.price) : '<span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">En Turno</span>'}</span>
        </div>
        <div class="card-action-bar">
          ${getActionButtonsForOrder(order)}
        </div>
      `;
      return card;
    }

    function getActionButtonsForOrder(order) {
      const isOperario = appState.currentRole === 'operario' || appState.currentRole === 'lavador';

      if (order.status === 'espera') {
        return `<button class="btn-card-action btn-card-primary" onclick="advanceOrderStatus('${order.id}', 'lavando')"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>Iniciar Lavado</button>`;
      } else if (order.status === 'lavando') {
        return `<button class="btn-card-action btn-card-primary" onclick="advanceOrderStatus('${order.id}', 'listo')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>Marcar como Listo</button>`;
      } else if (order.status === 'listo') {
        if (isOperario) {
          return `<button class="btn-card-action" style="cursor:default; opacity:0.8;">Esperando Entrega</button>`;
        }
        return `
          ${order.phone ? `<a href="${getWhatsAppLink(order)}" target="_blank" class="btn-card-action btn-whatsapp-action"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>Avisar WhatsApp</a>` : ''}
          <button class="btn-card-action btn-card-primary" onclick="openCheckoutModal('${order.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>Cobrar y Entregar</button>
        `;
      } else {
        if (isOperario) return '';
        return `<button class="btn-card-action" onclick="viewOrderTicket('${order.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>Ver Ticket</button>`;
      }
    }

    function advanceOrderStatus(orderId, nextStatus) {
      const order = appState.orders.find(o => o.id === orderId);
      if (order) {
        order.status = nextStatus;
        saveToStorage();
        renderAllViews();
      }
    }

    function updateKanbanTimers() {
      if (document.getElementById('view-patio').classList.contains('active')) {
        renderKanban();
      }
    }
