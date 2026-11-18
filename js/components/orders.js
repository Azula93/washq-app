/**
 * WashQ / KodiQuett — Gestión Operativa de Turnos y Órdenes
 * Registro rápido (F2), asignación de bahía/operario, cobro al checkout y edición.
 */

    function openEditOrderModal(orderId) {
      const order = appState.orders.find(o => o.id === orderId);
      if (!order) return;

      document.getElementById('editOrderId').value = order.id;
      document.getElementById('editOrderPlate').value = order.plate;
      document.getElementById('editOrderPrice').value = order.price;
      document.getElementById('editOrderCommission').value = order.commission;
      document.getElementById('editOrderPhone').value = order.phone || '';
      document.getElementById('editOrderNotes').value = order.notes || '';
      document.getElementById('editOrderStatusSelect').value = order.status;

      // Dropdown de servicios
      const sSelect = document.getElementById('editOrderServiceSelect');
      sSelect.innerHTML = '';
      appState.services.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `[${s.type.toUpperCase()}] ${s.name} - ${formatCOP(s.price)}`;
        if (s.id === order.serviceId) opt.selected = true;
        sSelect.appendChild(opt);
      });

      // Dropdown de operarioes
      const wSelect = document.getElementById('editOrderWasherSelect');
      wSelect.innerHTML = '<option value="">-- Sin Operario asignado --</option>';
      appState.washers.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = w.name;
        if (w.id === order.washerId) opt.selected = true;
        wSelect.appendChild(opt);
      });

      // Dropdown de métodos de pago
      const pmSelect = document.getElementById('editOrderPaymentMethodSelect');
      pmSelect.innerHTML = '<option value="">-- Pendiente de Cobro --</option>';
      appState.paymentMethods.forEach(pm => {
        const opt = document.createElement('option');
        opt.value = pm.id;
        opt.textContent = pm.name;
        if (pm.id === order.paymentMethod) opt.selected = true;
        pmSelect.appendChild(opt);
      });

      openModal('modalEditOrder');
    }

    function syncEditOrderService() {
      const sId = document.getElementById('editOrderServiceSelect').value;
      const service = appState.services.find(s => s.id === sId);
      if (service) {
        document.getElementById('editOrderPrice').value = service.price;
        let comm = service.commType === 'porcentaje' ? (service.price * service.commVal / 100) : service.commVal;
        document.getElementById('editOrderCommission').value = comm;
      }
    }

    function saveOrderEdits() {
      const orderId = document.getElementById('editOrderId').value;
      const order = appState.orders.find(o => o.id === orderId);
      if (!order) return;

      const plate = document.getElementById('editOrderPlate').value.trim();
      if (!plate) { alert('La placa no puede estar vacía'); return; }

      const sId = document.getElementById('editOrderServiceSelect').value;
      const service = appState.services.find(s => s.id === sId);
      const wId = document.getElementById('editOrderWasherSelect').value;
      const washer = appState.washers.find(w => w.id === wId);

      order.plate = plate;
      if (service) {
        order.serviceId = service.id;
        order.serviceName = service.name;
        order.vehicleType = service.type;
      }
      order.price = Number(document.getElementById('editOrderPrice').value);
      order.commission = Number(document.getElementById('editOrderCommission').value);
      order.washerId = washer ? washer.id : null;
      order.washerName = washer ? washer.name : null;
      order.status = document.getElementById('editOrderStatusSelect').value;
      order.paymentMethod = document.getElementById('editOrderPaymentMethodSelect').value || null;
      order.phone = document.getElementById('editOrderPhone').value.trim();
      order.notes = document.getElementById('editOrderNotes').value.trim();

      saveToStorage();
      closeModal('modalEditOrder');
      renderAllViews();
    }

    function deleteCurrentOrder() {
      const orderId = document.getElementById('editOrderId').value;
      deleteOrderById(orderId);
      closeModal('modalEditOrder');
    }

    async function deleteOrderById(orderId) {
      const order = appState.orders.find(o => o.id === orderId);
      if (!order) return;
      const confirmed = await showConfirmDialog({
        title: '¿Eliminar vehículo ' + order.plate + '?',
        message: 'Esta acción ajustará los ingresos y comisiones automáticamente.',
        confirmText: 'Eliminar Vehículo',
        cancelText: 'Cancelar',
        type: 'danger'
      });
      if (confirmed) {
        appState.orders = appState.orders.filter(o => o.id !== orderId);
        saveToStorage();
        renderAllViews();
        showToast('Vehículo ' + order.plate + ' eliminado del sistema.', 'info');
      }
    }


    function openNewOrderModal() {
      const soloMotos = isSedeSoloMotos();
      const selector = document.getElementById('orderVehicleTypeSelector');
      if (selector) {
        const nonMotoBtns = selector.querySelectorAll('.vtype-btn:not([data-vtype="moto"])');
        nonMotoBtns.forEach(b => {
          b.style.display = soloMotos ? 'none' : 'flex';
        });
        selector.style.gridTemplateColumns = soloMotos ? '1fr' : '';
      }

      const badge = document.getElementById('orderPlateDetectedBadge');
      if (badge) {
        if (soloMotos) {
          badge.textContent = 'Exclusivo Motos';
          badge.style.display = 'inline-block';
          badge.style.background = '#FEF3C7';
          badge.style.color = '#D97706';
        } else {
          badge.style.display = 'none';
        }
      }

      const defaultType = soloMotos ? 'moto' : 'carro';
      selectVehicleType(defaultType);
      populateWashersDropdown();
      document.getElementById('orderPlateInput').value = '';
      document.getElementById('orderPhoneInput').value = '';
      document.getElementById('orderNotesInput').value = '';
      openModal('modalNewOrder');
      setTimeout(() => document.getElementById('orderPlateInput').focus(), 150);
    }

    function selectVehicleType(type, btn) {
      appState.selectedVehicleType = type;
      const targetBtn = btn || document.querySelector(`.vtype-btn[data-vtype="${type}"]`);
      document.querySelectorAll('.vtype-btn').forEach(b => b.classList.remove('active'));
      if (targetBtn) {
        targetBtn.classList.add('active');
      }

      const grid = document.getElementById('modalServicesGrid');
      if (!grid) return;
      grid.innerHTML = '';
      const services = appState.services.filter(s => s.type === type);
      services.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = `service-select-card ${idx === 0 ? 'active' : ''}`;
        if (idx === 0) appState.selectedServiceId = s.id;
        card.onclick = () => {
          document.querySelectorAll('.service-select-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          appState.selectedServiceId = s.id;
        };
        card.innerHTML = `
          <div class="svc-card-name">${s.name}</div>
          <div class="svc-card-price">${formatCOP(s.price)} &bull; ${s.duration} min</div>
        `;
        grid.appendChild(card);
      });
    }

    function populateWashersDropdown() {
      const select = document.getElementById('orderWasherSelect');
      select.innerHTML = '<option value="">-- Asignación Automática / Por Asignar --</option>';
      appState.washers.filter(w => w.active).forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = w.name;
        select.appendChild(opt);
      });
    }

    function submitNewOrder() {
      const plate = document.getElementById('orderPlateInput').value.trim();
      if (!plate || plate.length < 5) {
        alert('Por favor ingrese una placa válida (ej: ABC-123)');
        return;
      }

      const service = appState.services.find(s => s.id === appState.selectedServiceId);
      if (!service) {
        alert('Seleccione un servicio');
        return;
      }

      const washerId = document.getElementById('orderWasherSelect').value;
      const washer = appState.washers.find(w => w.id === washerId);

      let commVal = 0;
      if (service.commType === 'porcentaje') {
        commVal = (service.price * service.commVal) / 100;
      } else {
        commVal = Number(service.commVal || 0);
      }

      const newOrder = {
        id: 'ord_' + Date.now(),
        ticketNumber: appState.orders.length + 1,
        plate: plate,
        vehicleType: appState.selectedVehicleType,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        washerId: washer ? washer.id : null,
        washerName: washer ? washer.name : null,
        commission: commVal,
        createdAt: Date.now(),
        estimatedDuration: service.duration,
        estimatedDelivery: Date.now() + (service.duration * 60000),
        status: 'espera',
        phone: document.getElementById('orderPhoneInput').value.trim(),
        notes: document.getElementById('orderNotesInput').value.trim(),
        paymentMethod: (document.getElementById('orderPaymentMethodInput') && document.getElementById('orderPaymentMethodInput').value) ? document.getElementById('orderPaymentMethodInput').value : null
      };

      appState.orders.unshift(newOrder);
      saveToStorage();
      closeModal('modalNewOrder');
      renderAllViews();
      setTimeout(() => {
        viewOrderTicket(newOrder.id);
      }, 50);
    }

    // ================= COBRO & CHECKOUT =================

    function openCheckoutModal(orderId) {
      const order = appState.orders.find(o => o.id === orderId);
      if (!order) return;

      document.getElementById('checkoutOrderId').value = order.id;
      document.getElementById('checkoutPlateDisplay').textContent = order.plate;
      document.getElementById('checkoutServiceDisplay').textContent = order.serviceName;
      document.getElementById('checkoutPriceDisplay').textContent = formatCOP(order.price);

      const pmSelect = document.getElementById('checkoutPaymentMethod');
      pmSelect.innerHTML = '';
      appState.paymentMethods.forEach(pm => {
        const opt = document.createElement('option');
        opt.value = pm.id;
        opt.textContent = pm.name;
        pmSelect.appendChild(opt);
      });

      openModal('modalCheckout');
    }

    function confirmCheckout() {
      const orderId = document.getElementById('checkoutOrderId').value;
      const pm = document.getElementById('checkoutPaymentMethod').value;
      const order = appState.orders.find(o => o.id === orderId);

      if (order) {
        order.status = 'entregado';
        order.paymentMethod = pm;
        order.completedAt = Date.now();
        saveToStorage();
        closeModal('modalCheckout');
        renderAllViews();
      }
    }

    // ================= VISOR DE TICKET POS =================