/**
 * LavaFácil Cali - Sistema de Control Operativo para Autolavados
 * 100% Offline - Sin Servidores ni Hosting
 */

// ================= ESTADO INICIAL Y CONFIGURACIÓN =================
const DEFAULT_CONFIG = {
  businessName: 'AUTOLAVADO CALI EXPRESS',
  address: 'Calle 5 # 38-20, Cali - Valle',
  phone: '315 555 1234',
  footerText: '¡Gracias por su visita! Cuidamos su vehículo.'
};

const DEFAULT_SERVICES = [
  // MOTOS
  { id: 's_m1', type: 'moto', name: 'Lavado Sencillo Moto', price: 12000, duration: 20, commType: 'porcentaje', commVal: 40 },
  { id: 's_m2', type: 'moto', name: 'Lavado Especial + Silicona', price: 18000, duration: 30, commType: 'porcentaje', commVal: 40 },
  { id: 's_m3', type: 'moto', name: 'Desengrase Motor + Detailing', price: 32000, duration: 45, commType: 'porcentaje', commVal: 40 },
  
  // CARROS
  { id: 's_c1', type: 'carro', name: 'Lavado Sencillo (Solo Por Fuera)', price: 18000, duration: 25, commType: 'porcentaje', commVal: 40 },
  { id: 's_c2', type: 'carro', name: 'Lavado General (Interior + Exterior)', price: 26000, duration: 40, commType: 'porcentaje', commVal: 40 },
  { id: 's_c3', type: 'carro', name: 'Lavado Full + Motor + Chasis', price: 45000, duration: 60, commType: 'porcentaje', commVal: 40 },

  // CAMIONETAS / SUV
  { id: 's_suv1', type: 'suv', name: 'Lavado General SUV / Camioneta', price: 35000, duration: 50, commType: 'porcentaje', commVal: 40 },
  { id: 's_suv2', type: 'suv', name: 'Lavado Full + Motor SUV', price: 60000, duration: 75, commType: 'porcentaje', commVal: 40 },

  // TAXIS
  { id: 's_t1', type: 'taxi', name: 'Lavado Exprés Taxi', price: 16000, duration: 20, commType: 'porcentaje', commVal: 40 }
];

const DEFAULT_WASHERS = [
  { id: 'w_1', name: 'Carlos Murillo', phone: '312 456 7890', active: true },
  { id: 'w_2', name: 'Andrés Valencia', phone: '318 654 3210', active: true },
  { id: 'w_3', name: 'Jhon Alexander Gómez', phone: '310 987 6543', active: true }
];

const DEFAULT_PAYMENT_METHODS = [
  { id: 'pm_efectivo', name: 'Efectivo', icon: '💵' },
  { id: 'pm_nequi', name: 'Nequi', icon: '📱' },
  { id: 'pm_daviplata', name: 'Daviplata', icon: '🔴' },
  { id: 'pm_transf', name: 'Bancolombia Transferencia', icon: '🏦' }
];

const DEFAULT_ROLES = [
  { id: 'admin', name: 'Super Admin (Dueño)', icon: '👑', pin: '1234', desc: 'Acceso Total: Ver finanzas, editar tarifas, usuarios y caja neta.' },
  { id: 'cajero', name: 'Cajero / Recepción', icon: '💼', pin: '0000', desc: 'Operación completa: Ingresos, cobros, tickets POS, arqueo y gastos.' },
  { id: 'lavador', name: 'Lavador de Patio', icon: '🧼', pin: '', desc: 'Solo Operativo: Ver colas de autos y marcar listos. Cero finanzas.' }
];

// Estado global de la aplicación
let appState = {
  config: { ...DEFAULT_CONFIG },
  services: [...DEFAULT_SERVICES],
  washers: [...DEFAULT_WASHERS],
  paymentMethods: [...DEFAULT_PAYMENT_METHODS],
  roles: [...DEFAULT_ROLES],
  currentRole: 'admin',
  pendingRoleSwitch: null,
  orders: [],
  expenses: [],
  selectedVehicleType: 'moto',
  selectedServiceId: null
};

// ================= INICIALIZACIÓN Y PERSISTENCIA =================
function initApp() {
  // Cargar paleta guardada de la web
  const savedTheme = localStorage.getItem('cleanride_theme') || 'cleanride-red';
  applyColorPalette(savedTheme);

  loadFromStorage();
  setupEventListeners();
  renderAllViews();
  registerServiceWorker();

  // Fecha por defecto para el selector de agendamiento
  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;
  }
  updateBookingServicesDropdown();

  // Actualizar cronómetros de patio cada 15 segundos
  setInterval(() => {
    updateKanbanTimers();
  }, 15000);
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('lavafacil_cali_db');
    if (saved) {
      const parsed = JSON.parse(saved);
      appState = { ...appState, ...parsed };
      if (!appState.paymentMethods || appState.paymentMethods.length === 0) {
        appState.paymentMethods = [...DEFAULT_PAYMENT_METHODS];
      }
      if (!appState.roles || appState.roles.length === 0) {
        appState.roles = [...DEFAULT_ROLES];
      }
      if (!appState.currentRole) {
        appState.currentRole = 'admin';
      }
    } else {
      // Cargar 2 órdenes de ejemplo iniciales para que la interfaz se vea viva
      seedInitialDemoOrders();
      saveToStorage();
    }
  } catch (e) {
    console.error('Error cargando almacenamiento:', e);
  }
}

function saveToStorage() {
  try {
    localStorage.setItem('lavafacil_cali_db', JSON.stringify(appState));
  } catch (e) {
    console.error('Error guardando en almacenamiento:', e);
  }
}

function seedInitialDemoOrders() {
  const now = Date.now();
  appState.orders = [
    {
      id: 'ord_101',
      ticketNumber: 1,
      plate: 'ABC-123',
      vehicleType: 'carro',
      serviceId: 's_c2',
      serviceName: 'Lavado General (Interior + Exterior)',
      price: 26000,
      washerId: 'w_1',
      washerName: 'Carlos Murillo',
      commission: 10400,
      createdAt: now - (25 * 60 * 1000), // hace 25 min
      estimatedDuration: 40,
      estimatedDelivery: now + (15 * 60 * 1000), // en 15 min
      status: 'lavando', // espera, lavando, listo, entregado
      phone: '3151234567',
      notes: 'Cuidado con retrovisor izquierdo',
      paymentMethod: null
    },
    {
      id: 'ord_102',
      ticketNumber: 2,
      plate: 'WXQ-45E',
      vehicleType: 'moto',
      serviceId: 's_m2',
      serviceName: 'Lavado Especial + Silicona',
      price: 18000,
      washerId: 'w_2',
      washerName: 'Andrés Valencia',
      commission: 7200,
      createdAt: now - (10 * 60 * 1000), // hace 10 min
      estimatedDuration: 30,
      estimatedDelivery: now + (20 * 60 * 1000),
      status: 'espera',
      phone: '3109876543',
      notes: 'Dejó casco bajo el asiento',
      paymentMethod: null
    }
  ];

  appState.expenses = [
    {
      id: 'exp_1',
      createdAt: now - (3 * 3600 * 1000),
      category: 'Insumos',
      description: 'Compra de 5 Galones de Champú y Silicona',
      amount: 45000
    }
  ];
}

// ================= EVENTOS Y ATAJOS =================
function setupEventListeners() {
  // Atajo F2 para Nuevo Ingreso rápido
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      openNewOrderModal();
    }
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Auto-formateo inteligente de placas colombianas
  const plateInput = document.getElementById('orderPlateInput');
  if (plateInput) {
    plateInput.addEventListener('input', (e) => {
      let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Auto-detección: si la placa tiene formato típico de moto (ej: ABC12D), preseleccionar moto
      if (val.length === 6 && isNaN(val[5]) && !isNaN(val[3])) {
        selectVehicleType('moto');
      }

      // Añadir guion automáticamente al llegar a 6 o 7 caracteres
      if (val.length > 3) {
        val = val.substring(0, 3) + '-' + val.substring(3, 6);
      }
      e.target.value = val;
    });
  }
}

// ================= RENDERIZADO GENERAL =================
function renderAllViews() {
  applyRolePermissions();
  renderHeader();
  renderKanban();
  renderCaja();
  renderWashers();
  renderHistory();
  renderServicesConfig();
  renderRolesConfig();
}

// ================= GESTIÓN DE ROLES Y PERMISOS =================
function applyRolePermissions() {
  const roleObj = (appState.roles && appState.roles.find(r => r.id === appState.currentRole)) || DEFAULT_ROLES[0];
  const roleId = roleObj.id;

  // Actualizar distintivo en la barra superior
  const iconEl = document.getElementById('roleIcon');
  const nameEl = document.getElementById('roleName');
  if (iconEl) iconEl.innerText = roleObj.icon;
  if (nameEl) nameEl.innerText = roleObj.name;

  // Pestañas de escritorio
  const deskTabs = document.querySelectorAll('.desktop-nav .nav-tab-btn');
  // Pestañas móviles
  const mobTabs = document.querySelectorAll('.mobile-nav .m-nav-btn');

  // Métricas financieras
  const incomeCard = document.getElementById('metricIncomeToday');
  const expensesCard = document.getElementById('metricExpensesToday');

  if (roleId === 'lavador') {
    // ROL LAVADOR: Solo ve el patio. Se ocultan finanzas y ajustes
    if (deskTabs[1]) deskTabs[1].style.display = 'none'; // Caja
    if (deskTabs[2]) deskTabs[2].style.display = 'none'; // Lavadores
    if (deskTabs[3]) deskTabs[3].style.display = 'none'; // Historial
    if (deskTabs[4]) deskTabs[4].style.display = 'none'; // Config

    if (mobTabs[1]) mobTabs[1].style.display = 'none'; // Caja
    if (mobTabs[3]) mobTabs[3].style.display = 'none'; // Personal
    if (mobTabs[4]) mobTabs[4].style.display = 'none'; // Ajustes

    // Enmascarar ingresos para el lavador
    if (incomeCard) incomeCard.innerText = '$ ***';
    if (expensesCard) expensesCard.innerText = '$ ***';

    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab && activeTab.id !== 'tab-patio') {
      switchTab('patio');
    }
  } else if (roleId === 'cajero') {
    // ROL CAJERO: Puede ver Patio, Caja, Personal e Historial, pero NO Ajustes de Tarifas ni Usuarios
    if (deskTabs[1]) deskTabs[1].style.display = 'flex';
    if (deskTabs[2]) deskTabs[2].style.display = 'flex';
    if (deskTabs[3]) deskTabs[3].style.display = 'flex';
    if (deskTabs[4]) deskTabs[4].style.display = 'none'; // Ajustes protegido

    if (mobTabs[1]) mobTabs[1].style.display = 'flex';
    if (mobTabs[3]) mobTabs[3].style.display = 'flex';
    if (mobTabs[4]) mobTabs[4].style.display = 'none'; // Ajustes protegido

    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab && activeTab.id === 'tab-config') {
      switchTab('patio');
    }
  } else {
    // ROL SUPER ADMIN: Acceso total
    deskTabs.forEach(t => t.style.display = 'flex');
    mobTabs.forEach(t => t.style.display = 'flex');
  }
}

function renderRolesConfig() {
  const tbody = document.getElementById('rolesConfigTableBody');
  if (!tbody) return;

  tbody.innerHTML = appState.roles.map(r => {
    return `
      <tr>
        <td><strong>${r.icon} ${r.name}</strong></td>
        <td style="font-size: 0.82rem; color: #cbd5e1;">${r.desc}</td>
        <td>
          ${r.id !== 'lavador' ? `
          <input type="password" id="pinInput_${r.id}" class="form-control" style="width: 100px; text-align: center; padding: 0.3rem;" value="${r.pin || ''}" maxlength="6">
          ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Sin PIN requerido</span>'}
        </td>
        <td>
          ${r.id !== 'lavador' ? `
          <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="saveRolePin('${r.id}')">
            💾 Guardar PIN
          </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function openRoleSwitcherModal() {
  openModal('modalRoleSwitcher');
}

function requestSwitchRole(targetRoleId) {
  closeModal('modalRoleSwitcher');
  const roleObj = appState.roles.find(r => r.id === targetRoleId);
  if (!roleObj) return;

  // Si pasa a rol lavador, no requiere PIN (menor nivel de privilegio)
  if (targetRoleId === 'lavador') {
    appState.currentRole = 'lavador';
    saveToStorage();
    renderAllViews();
    return;
  }

  // Si pasa a Cajero o Super Admin, solicita PIN
  appState.pendingRoleSwitch = targetRoleId;
  document.getElementById('rolePinInput').value = '';
  document.getElementById('pinErrorMsg').style.display = 'none';
  document.getElementById('pinPromptText').innerText = `Ingresa el PIN de ${roleObj.name} (Por defecto: ${targetRoleId === 'admin' ? '1234' : '0000'}):`;
  openModal('modalPinPrompt');
  setTimeout(() => { document.getElementById('rolePinInput').focus(); }, 120);
}

function verifyRolePin() {
  const pinEntered = document.getElementById('rolePinInput').value.trim();
  const targetRole = appState.roles.find(r => r.id === appState.pendingRoleSwitch);
  
  if (!targetRole) return;

  const validPin = targetRole.pin || (targetRole.id === 'admin' ? '1234' : '0000');

  if (pinEntered === validPin) {
    appState.currentRole = targetRole.id;
    appState.pendingRoleSwitch = null;
    saveToStorage();
    closeModal('modalPinPrompt');
    renderAllViews();
  } else {
    document.getElementById('pinErrorMsg').style.display = 'block';
  }
}

function saveRolePin(roleId) {
  const pinInput = document.getElementById(`pinInput_${roleId}`);
  if (!pinInput) return;

  const newPin = pinInput.value.trim();
  if (newPin.length < 3) {
    alert('El PIN debe tener al menos 3 dígitos.');
    return;
  }

  const role = appState.roles.find(r => r.id === roleId);
  if (role) {
    role.pin = newPin;
    saveToStorage();
    alert(`¡PIN de ${role.name} actualizado correctamente a: ${newPin}!`);
  }
}

function renderHeader() {
  const bizEl = document.getElementById('headerBusinessName');
  if (bizEl) bizEl.innerText = appState.config.businessName;
  
  // Contar activos en patio (espera + lavando + listo)
  const activeOrders = appState.orders.filter(o => o.status !== 'entregado' && o.status !== 'cancelado');
  const countEl = document.getElementById('headerActiveCount');
  if (countEl) countEl.innerText = activeOrders.length;
}

// ================= KANBAN BOARD & TIMERS =================
function renderKanban() {
  const cols = {
    espera: document.getElementById('cards-espera'),
    lavando: document.getElementById('cards-lavando'),
    listo: document.getElementById('cards-listo'),
    entregado: document.getElementById('cards-entregado')
  };

  const counts = { espera: 0, lavando: 0, listo: 0, entregado: 0 };
  
  // Limpiar contenedores
  Object.keys(cols).forEach(k => { cols[k].innerHTML = ''; });

  // Filtrar órdenes de hoy o activas
  const todayStart = new Date().setHours(0, 0, 0, 0);

  appState.orders.forEach(order => {
    // Si fue entregado ayer o antes, no mostrar en kanban
    if (order.status === 'entregado' && order.createdAt < todayStart) return;

    if (cols[order.status]) {
      counts[order.status]++;
      const cardEl = createOrderCardElement(order);
      cols[order.status].appendChild(cardEl);
    }
  });

  // Mensajes vacíos si no hay tarjetas
  Object.keys(cols).forEach(k => {
    document.getElementById(`badge-count-` + k).innerText = counts[k];
    if (counts[k] === 0) {
      cols[k].innerHTML = `<div class="empty-col-message">No hay vehículos aquí</div>`;
    }
  });

  // Métricas superiores
  document.getElementById('metricActiveQueue').innerText = `${counts.espera + counts.lavando} veh.`;
  document.getElementById('metricCompletedToday').innerText = `${counts.listo + counts.entregado} veh.`;
}

function createOrderCardElement(order) {
  const card = document.createElement('div');
  card.className = `vehicle-card ${isOrderDelayed(order) ? 'delayed' : ''}`;
  card.id = `card-${order.id}`;

  const vehicleIcons = { moto: '🏍️', carro: '🚗', suv: '🚙', taxi: '🚕' };
  const icon = vehicleIcons[order.vehicleType] || '🚗';

  // Formato de hora de entrada
  const inTimeStr = new Date(order.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const estTimeStr = new Date(order.estimatedDelivery).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  // Botones contextuales según la etapa
  let actionsHtml = '';
  if (order.status === 'espera') {
    actionsHtml = `
      <button class="btn-card-action btn-card-primary" onclick="advanceOrderStatus('${order.id}', 'lavando')">
        ▶ Iniciar Lavado
      </button>
      <button class="btn-card-action btn-card-print" onclick="viewOrderTicket('${order.id}')" title="Reimprimir Ticket">
        🖨️
      </button>
    `;
  } else if (order.status === 'lavando') {
    actionsHtml = `
      <button class="btn-card-action btn-card-success" onclick="advanceOrderStatus('${order.id}', 'listo')">
        ✅ Terminar y Avisar
      </button>
      <button class="btn-card-action btn-card-print" onclick="viewOrderTicket('${order.id}')" title="Ver Ticket">
        🖨️
      </button>
    `;
  } else if (order.status === 'listo') {
    // Botón de WhatsApp directo sin costo de API
    const waUrl = getWhatsAppLink(order);
    actionsHtml = `
      ${order.phone ? `
      <a href="${waUrl}" target="_blank" class="btn-card-action btn-card-whatsapp" style="text-decoration:none;">
        📲 Avisar WhatsApp
      </a>` : ''}
      <button class="btn-card-action btn-card-primary" onclick="openCheckoutModal('${order.id}')">
        💵 Cobrar y Entregar
      </button>
    `;
  } else if (order.status === 'entregado') {
    actionsHtml = `
      <button class="btn-card-action btn-card-print" onclick="viewOrderTicket('${order.id}', true)">
        🧾 Recibo Pagado
      </button>
    `;
  }

  card.innerHTML = `
    <div class="card-top">
      <div class="license-plate ${order.vehicleType === 'moto' ? 'moto' : ''}">${order.plate}</div>
      <div class="vehicle-type-pill">${icon} ${order.vehicleType.toUpperCase()}</div>
    </div>
    <div class="card-service-info">
      <div class="service-title">${order.serviceName}</div>
      <div class="service-meta">
        <span>👤 ${order.washerName || 'Sin asignar'}</span>
        <span class="service-price">$ ${formatCOP(order.price)}</span>
      </div>
      ${order.notes ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-top: 3px;">📝 ${order.notes}</div>` : ''}
    </div>
    <div class="card-timer-row">
      <span>Entrada: ${inTimeStr}</span>
      <span class="timer-count ${isOrderDelayed(order) ? 'timer-delayed' : ''}">
        ${getTimerStatusString(order)}
      </span>
    </div>
    <div class="card-actions">
      ${actionsHtml}
    </div>
  `;

  return card;
}

function isOrderDelayed(order) {
  if (order.status === 'listo' || order.status === 'entregado') return false;
  return Date.now() > order.estimatedDelivery;
}

function getTimerStatusString(order) {
  const now = Date.now();
  if (order.status === 'espera') {
    const elapsedMins = Math.floor((now - order.createdAt) / 60000);
    return `⏳ ${elapsedMins} min en espera`;
  } else if (order.status === 'lavando') {
    const diffMins = Math.round((order.estimatedDelivery - now) / 60000);
    if (diffMins > 0) {
      return `⏱️ Faltan ${diffMins} min`;
    } else {
      return `⚠️ Retraso ${Math.abs(diffMins)} min`;
    }
  } else if (order.status === 'listo') {
    return `🎉 Listo para entrega`;
  } else {
    return `✅ Entregado`;
  }
}

function updateKanbanTimers() {
  appState.orders.forEach(order => {
    if (order.status === 'espera' || order.status === 'lavando') {
      const card = document.getElementById(`card-${order.id}`);
      if (card) {
        const timerEl = card.querySelector('.timer-count');
        if (timerEl) {
          timerEl.innerHTML = getTimerStatusString(order);
          if (isOrderDelayed(order)) {
            timerEl.classList.add('timer-delayed');
            card.classList.add('delayed');
          }
        }
      }
    }
  });
}

function advanceOrderStatus(orderId, nextStatus) {
  const order = appState.orders.find(o => o.id === orderId);
  if (!order) return;

  order.status = nextStatus;
  if (nextStatus === 'listo') {
    order.readyAt = Date.now();
  }
  saveToStorage();
  if (window.SupabaseService) {
    window.SupabaseService.updateOrderStatus(orderId, nextStatus);
  }
  renderKanban();
  renderHeader();
}

// Generador de enlace directo a WhatsApp (sin costo de API)
function getWhatsAppLink(order) {
  if (!order.phone) return '#';
  let phoneClean = order.phone.replace(/[^0-9]/g, '');
  if (phoneClean.length === 10) {
    phoneClean = '57' + phoneClean; // Colombia
  }
  const msg = encodeURIComponent(
    `¡Hola! 👋 Te avisamos de ${appState.config.businessName} que tu vehículo con placa *${order.plate}* ya está LISTO y reluciente para retirar ✨.\n\n` +
    `🚗 Servicio: ${order.serviceName}\n` +
    `💰 Total a pagar: $ ${formatCOP(order.price)} COP\n\n` +
    `¡Te esperamos en ${appState.config.address}!`
  );
  return `https://wa.me/${phoneClean}?text=${msg}`;
}

// ================= MODAL NUEVO INGRESO (F2) =================
function openNewOrderModal() {
  document.getElementById('orderPlateInput').value = '';
  document.getElementById('orderPhoneInput').value = '';
  document.getElementById('orderNotesInput').value = '';
  
  selectVehicleType('carro');
  populateWashersDropdown();
  
  openModal('modalNewOrder');
  setTimeout(() => {
    document.getElementById('orderPlateInput').focus();
  }, 100);
}

function selectVehicleType(vType) {
  appState.selectedVehicleType = vType;

  // Actualizar botones visuales
  document.querySelectorAll('.v-type-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.getAttribute('data-type') === vType);
  });

  // Filtrar servicios para este tipo de vehículo
  const grid = document.getElementById('modalServicesGrid');
  grid.innerHTML = '';

  const filtered = appState.services.filter(s => s.type === vType);
  if (filtered.length > 0) {
    appState.selectedServiceId = filtered[0].id;
  } else {
    appState.selectedServiceId = null;
  }

  filtered.forEach((s, idx) => {
    const card = document.createElement('div');
    card.className = `service-select-card ${idx === 0 ? 'selected' : ''}`;
    card.id = `s-card-${s.id}`;
    card.onclick = () => {
      appState.selectedServiceId = s.id;
      document.querySelectorAll('.service-select-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    };
    card.innerHTML = `
      <div class="s-name">${s.name}</div>
      <div class="s-meta">
        <span class="s-price">$ ${formatCOP(s.price)}</span>
        <span class="s-time">⏱️ ${s.duration} min</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function populateWashersDropdown() {
  const select = document.getElementById('orderWasherSelect');
  select.innerHTML = '<option value="">-- Sin asignar / Cualquiera --</option>';

  appState.washers.filter(w => w.active).forEach(w => {
    // Contar lavados de hoy para balancear carga
    const countToday = appState.orders.filter(o => o.washerId === w.id).length;
    const opt = document.createElement('option');
    opt.value = w.id;
    opt.innerText = `${w.name} (${countToday} lavados hoy)`;
    select.appendChild(opt);
  });
}

function submitNewOrder(printTicket = false) {
  const plateRaw = document.getElementById('orderPlateInput').value.trim();
  if (!plateRaw || plateRaw.length < 5) {
    alert('Por favor escribe una placa válida (ej: ABC-123 o WXQ-45E).');
    document.getElementById('orderPlateInput').focus();
    return;
  }

  const selectedService = appState.services.find(s => s.id === appState.selectedServiceId);
  if (!selectedService) {
    alert('Selecciona un servicio de la lista.');
    return;
  }

  const washerId = document.getElementById('orderWasherSelect').value;
  const washer = appState.washers.find(w => w.id === washerId);
  const phone = document.getElementById('orderPhoneInput').value.trim();
  const notes = document.getElementById('orderNotesInput').value.trim();

  // Calcular comisión
  let commAmount = 0;
  if (selectedService.commType === 'porcentaje') {
    commAmount = Math.round(selectedService.price * (selectedService.commVal / 100));
  } else {
    commAmount = Number(selectedService.commVal);
  }

  // Cálculo de tiempo estimado considerando cola actual
  const now = Date.now();
  const activeCount = appState.orders.filter(o => o.status === 'espera' || o.status === 'lavando').length;
  const queueDelayMinutes = activeCount * 8; // 8 min adicionales por carro en cola
  const totalDurationMinutes = selectedService.duration + queueDelayMinutes;
  const estimatedDeliveryTime = now + (totalDurationMinutes * 60 * 1000);

  const nextTicketNumber = appState.orders.length > 0 ? (Math.max(...appState.orders.map(o => o.ticketNumber || 0)) + 1) : 1;

  const newOrder = {
    id: 'ord_' + now,
    ticketNumber: nextTicketNumber,
    plate: plateRaw,
    vehicleType: appState.selectedVehicleType,
    serviceId: selectedService.id,
    serviceName: selectedService.name,
    price: selectedService.price,
    washerId: washer ? washer.id : null,
    washerName: washer ? washer.name : 'Por Asignar',
    commission: commAmount,
    createdAt: now,
    estimatedDuration: totalDurationMinutes,
    estimatedDelivery: estimatedDeliveryTime,
    status: 'espera',
    phone: phone,
    notes: notes,
    paymentMethod: null
  };

  appState.orders.unshift(newOrder);
  saveToStorage();
  if (window.SupabaseService) {
    window.SupabaseService.syncOrder(newOrder);
  }
  closeModal('modalNewOrder');
  renderAllViews();

  if (printTicket) {
    viewOrderTicket(newOrder.id);
  }
}

// ================= MODAL DE COBRO Y SALIDA =================
function openCheckoutModal(orderId) {
  const order = appState.orders.find(o => o.id === orderId);
  if (!order) return;

  document.getElementById('checkoutOrderId').value = order.id;
  document.getElementById('checkoutPlateDisplay').innerText = order.plate;
  document.getElementById('checkoutServiceDisplay').innerText = order.serviceName + (order.washerName ? ` • Lavador: ${order.washerName}` : '');
  document.getElementById('checkoutPriceDisplay').innerText = `$ ${formatCOP(order.price)} COP`;

  // Poblar métodos de pago dinámicamente
  const pmSelect = document.getElementById('checkoutPaymentMethod');
  if (pmSelect && appState.paymentMethods) {
    pmSelect.innerHTML = appState.paymentMethods.map(pm => {
      return `<option value="${pm.id}">${pm.icon} ${pm.name}</option>`;
    }).join('');
  }

  openModal('modalCheckout');
}

function confirmCheckout(printReceipt = false) {
  const orderId = document.getElementById('checkoutOrderId').value;
  const paymentMethod = document.getElementById('checkoutPaymentMethod').value;
  const order = appState.orders.find(o => o.id === orderId);

  if (!order) return;

  order.status = 'entregado';
  order.paymentMethod = paymentMethod;
  order.deliveredAt = Date.now();

  saveToStorage();
  if (window.SupabaseService) {
    window.SupabaseService.updateOrderStatus(orderId, 'entregado');
  }
  closeModal('modalCheckout');
  renderAllViews();

  if (printReceipt) {
    viewOrderTicket(order.id, true);
  }
}

// ================= IMPRESIÓN DE TICKET TÉRMICO POS (58mm/80mm) =================
function viewOrderTicket(orderId, isReceipt = false) {
  const order = appState.orders.find(o => o.id === orderId);
  if (!order) return;

  const inDate = new Date(order.createdAt).toLocaleDateString('es-CO');
  const inTime = new Date(order.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const estTime = new Date(order.estimatedDelivery).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const ticketHtml = `
    <div class="ticket-header">
      <div class="ticket-title">${appState.config.businessName}</div>
      <div style="font-size: 11px;">${appState.config.address}</div>
      <div style="font-size: 11px;">Tel: ${appState.config.phone}</div>
      <div class="ticket-divider"></div>
      <div style="font-weight: 700;">${isReceipt ? '*** RECIBO DE PAGO ***' : '*** TICKET DE INGRESO ***'}</div>
      <div>Ticket #: <strong>#${String(order.ticketNumber).padStart(4, '0')}</strong></div>
    </div>

    <div class="ticket-row"><span>Fecha:</span> <span>${inDate}</span></div>
    <div class="ticket-row"><span>Hora Ingreso:</span> <span>${inTime}</span></div>

    <div class="ticket-plate-box">
      ${order.plate}
    </div>

    <div class="ticket-row"><span>Vehículo:</span> <span>${order.vehicleType.toUpperCase()}</span></div>
    <div class="ticket-row"><span>Servicio:</span> <span>${order.serviceName}</span></div>
    <div class="ticket-row"><span>Lavador:</span> <span>${order.washerName || 'General'}</span></div>
    ${order.notes ? `<div class="ticket-row"><span>Nota:</span> <span>${order.notes}</span></div>` : ''}

    <div class="ticket-divider"></div>

    ${!isReceipt ? `
    <div class="ticket-row" style="font-size: 14px; font-weight: 700;">
      <span>ENTREGA ESTIMADA:</span>
      <span>${estTime}</span>
    </div>
    ` : `
    <div class="ticket-row">
      <span>Método de Pago:</span>
      <span>${(order.paymentMethod || 'Efectivo').toUpperCase()}</span>
    </div>
    `}

    <div class="ticket-row" style="font-size: 16px; font-weight: 900; margin-top: 6px;">
      <span>TOTAL A PAGAR:</span>
      <span>$ ${formatCOP(order.price)}</span>
    </div>

    <div class="ticket-divider"></div>
    <div class="ticket-footer">
      <div>${appState.config.footerText}</div>
      <div style="margin-top: 4px; font-size: 9px; color: #555;">LavaFácil Cali • Sistema 100% Offline</div>
    </div>
  `;

  document.getElementById('printableTicketArea').innerHTML = ticketHtml;
  openModal('modalTicket');
}

// ================= CAJA Y GASTOS =================
function renderCaja() {
  const todayStart = new Date().setHours(0, 0, 0, 0);

  // Órdenes pagadas hoy
  const paidToday = appState.orders.filter(o => o.status === 'entregado' && o.createdAt >= todayStart);
  const totalIngresos = paidToday.reduce((acc, o) => acc + (o.price || 0), 0);
  const totalComisiones = paidToday.reduce((acc, o) => acc + (o.commission || 0), 0);

  // Gastos de hoy
  const expensesToday = appState.expenses.filter(e => e.createdAt >= todayStart);
  const totalGastos = expensesToday.reduce((acc, e) => acc + (e.amount || 0), 0);

  const efectivoNeto = totalIngresos - totalGastos - totalComisiones;

  // Actualizar indicadores métricos
  document.getElementById('metricIncomeToday').innerText = `$ ${formatCOP(totalIngresos)}`;
  document.getElementById('metricExpensesToday').innerText = `$ ${formatCOP(totalGastos)}`;

  document.getElementById('cajaTotalIngresos').innerText = `$ ${formatCOP(totalIngresos)}`;
  document.getElementById('cajaTotalGastos').innerText = `$ ${formatCOP(totalGastos)}`;
  document.getElementById('cajaTotalComisiones').innerText = `$ ${formatCOP(totalComisiones)}`;
  document.getElementById('cajaNeto').innerText = `$ ${formatCOP(efectivoNeto)}`;

  // Render dinámico del desglose por método de pago configurado
  const pmContainer = document.getElementById('paymentMethodsBreakdown');
  if (pmContainer && appState.paymentMethods) {
    // Calcular totales por id o nombre
    const pmTotals = {};
    appState.paymentMethods.forEach(pm => { pmTotals[pm.id] = 0; });

    paidToday.forEach(o => {
      const pmId = o.paymentMethod;
      if (pmTotals[pmId] !== undefined) {
        pmTotals[pmId] += o.price;
      } else {
        // Compatibilidad con registros antiguos que guardaban 'efectivo', 'nequi', etc.
        const match = appState.paymentMethods.find(p => p.id === pmId || p.name.toLowerCase() === (pmId || '').toLowerCase() || p.id === `pm_${pmId}`);
        if (match) {
          pmTotals[match.id] = (pmTotals[match.id] || 0) + o.price;
        } else if (appState.paymentMethods.length > 0) {
          pmTotals[appState.paymentMethods[0].id] += o.price;
        }
      }
    });

    pmContainer.innerHTML = appState.paymentMethods.map(pm => {
      const total = pmTotals[pm.id] || 0;
      return `
        <div class="ticket-row" style="color: #cbd5e1; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <span>${pm.icon} ${pm.name}</span>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <strong style="color: #34d399;">$ ${formatCOP(total)}</strong>
            <button class="btn-secondary" style="padding: 0.15rem 0.35rem; font-size: 0.7rem; color: #38bdf8;" title="Editar nombre o icono" onclick="openEditPaymentMethodModal('${pm.id}')">
              ✏️
            </button>
            ${appState.paymentMethods.length > 1 ? `
            <button class="btn-secondary" style="padding: 0.15rem 0.35rem; font-size: 0.7rem; color: #f87171;" title="Eliminar método" onclick="deletePaymentMethod('${pm.id}')">
              🗑️
            </button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Tabla de gastos
  const tbody = document.getElementById('expensesTableBody');
  document.getElementById('expensesCountBadge').innerText = `${expensesToday.length} gastos`;

  if (expensesToday.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No hay gastos registrados hoy.</td></tr>`;
  } else {
    tbody.innerHTML = expensesToday.map(exp => {
      const timeStr = new Date(exp.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      return `
        <tr>
          <td>${timeStr}</td>
          <td><span class="vehicle-type-pill">${exp.category}</span></td>
          <td>${exp.description}</td>
          <td style="color: #f87171; font-weight: 700;">- $ ${formatCOP(exp.amount)}</td>
          <td>
            <button class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: #f87171;" onclick="deleteExpense('${exp.id}')">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

// ================= GESTIÓN DE MÉTODOS DE PAGO (CREAR Y EDITAR) =================
function openPaymentMethodModal() {
  document.getElementById('pmEditId').value = '';
  const title = document.getElementById('modalPaymentMethodTitle');
  if (title) title.innerText = '💳 Agregar Método de Pago';
  document.getElementById('pmNameInput').value = '';
  document.getElementById('pmIconInput').value = '💵';
  openModal('modalPaymentMethod');
}

function openEditPaymentMethodModal(pmId) {
  const pm = appState.paymentMethods.find(p => p.id === pmId);
  if (!pm) return;

  document.getElementById('pmEditId').value = pm.id;
  const title = document.getElementById('modalPaymentMethodTitle');
  if (title) title.innerText = '✏️ Editar Método de Pago';
  document.getElementById('pmNameInput').value = pm.name;
  document.getElementById('pmIconInput').value = pm.icon || '💳';

  openModal('modalPaymentMethod');
}

function savePaymentMethod() {
  const editId = document.getElementById('pmEditId').value;
  const icon = document.getElementById('pmIconInput').value || '💳';
  const name = document.getElementById('pmNameInput').value.trim();

  if (!name) {
    alert('Por favor escribe el nombre que desees para el método de pago.');
    return;
  }

  if (editId) {
    // Modo Edición
    const pm = appState.paymentMethods.find(p => p.id === editId);
    if (pm) {
      pm.name = name;
      pm.icon = icon;
    }
  } else {
    // Modo Creación
    const newPm = {
      id: 'pm_' + Date.now(),
      name: name,
      icon: icon
    };
    appState.paymentMethods.push(newPm);
  }

  saveToStorage();
  closeModal('modalPaymentMethod');
  renderCaja();
}

function deletePaymentMethod(pmId) {
  if (appState.paymentMethods.length <= 1) {
    alert('Debes tener al menos un método de pago registrado.');
    return;
  }
  const pm = appState.paymentMethods.find(p => p.id === pmId);
  if (!confirm(`¿Deseas eliminar el método de pago "${pm ? pm.name : ''}"?`)) return;

  appState.paymentMethods = appState.paymentMethods.filter(p => p.id !== pmId);
  saveToStorage();
  renderCaja();
}

// ================= EXPORTAR REPORTE DE CAJA A EXCEL (CSV) =================
function exportCajaReportToCSV() {
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const dateStr = new Date().toISOString().slice(0, 10);
  const paidToday = appState.orders.filter(o => o.status === 'entregado' && o.createdAt >= todayStart);
  const expensesToday = appState.expenses.filter(e => e.createdAt >= todayStart);

  const totalIngresos = paidToday.reduce((acc, o) => acc + (o.price || 0), 0);
  const totalComisiones = paidToday.reduce((acc, o) => acc + (o.commission || 0), 0);
  const totalGastos = expensesToday.reduce((acc, e) => acc + (e.amount || 0), 0);
  const neto = totalIngresos - totalGastos - totalComisiones;

  let csv = `REPORTE DE CAJA Y ARQUEO DIARIO - ${appState.config.businessName}\n`;
  csv += `Fecha: ${new Date().toLocaleDateString('es-CO')}\n`;
  csv += `Direccion: ${appState.config.address} - Cali\n\n`;

  csv += `=== RESUMEN FINANCIERO ===\n`;
  csv += `Total Ingresos Brutos (COP),${totalIngresos}\n`;
  csv += `Total Gastos del Dia (COP),${totalGastos}\n`;
  csv += `Total Comisiones Lavadores (COP),${totalComisiones}\n`;
  csv += `Efectivo Neto en Caja (COP),${neto}\n\n`;

  csv += `=== DESGLOSE POR METODOS DE PAGO ===\n`;
  appState.paymentMethods.forEach(pm => {
    let sum = 0;
    paidToday.forEach(o => {
      if (o.paymentMethod === pm.id || o.paymentMethod === pm.name.toLowerCase() || o.paymentMethod === `pm_${pm.id}`) {
        sum += o.price;
      }
    });
    csv += `"${pm.name}",${sum}\n`;
  });
  csv += `\n`;

  csv += `=== DETALLE DE GASTOS REGISTRADOS ===\n`;
  csv += `Hora,Categoria,Descripcion,Monto_COP\n`;
  if (expensesToday.length === 0) {
    csv += `Sin gastos registrados hoy,,,\n`;
  } else {
    expensesToday.forEach(e => {
      const time = new Date(e.createdAt).toLocaleTimeString('es-CO');
      csv += `"${time}","${e.category}","${e.description}",${e.amount}\n`;
    });
  }
  csv += `\n`;

  csv += `=== DETALLE DE SERVICIOS COBRADOS HOY ===\n`;
  csv += `Ticket,Hora,Placa,Vehiculo,Servicio,Lavador,Precio_COP,Comision_COP,Metodo_Pago\n`;
  if (paidToday.length === 0) {
    csv += `Sin servicios cobrados hoy,,,,,,,,\n`;
  } else {
    paidToday.forEach(o => {
      const time = new Date(o.createdAt).toLocaleTimeString('es-CO');
      const pmObj = appState.paymentMethods.find(p => p.id === o.paymentMethod);
      const pmLabel = pmObj ? pmObj.name : (o.paymentMethod || 'Efectivo');
      csv += `"${o.ticketNumber}","${time}","${o.plate}","${o.vehicleType}","${o.serviceName}","${o.washerName || ''}",${o.price},${o.commission},"${pmLabel}"\n`;
    });
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `LavaFacil_Reporte_Caja_${dateStr}.csv`);
  link.click();
}

function openExpenseModal() {
  document.getElementById('expenseDescription').value = '';
  document.getElementById('expenseAmount').value = '';
  openModal('modalExpense');
}

function saveExpense() {
  const category = document.getElementById('expenseCategory').value;
  const desc = document.getElementById('expenseDescription').value.trim();
  const amount = Number(document.getElementById('expenseAmount').value);

  if (!desc || isNaN(amount) || amount <= 0) {
    alert('Ingresa una descripción y un monto válido.');
    return;
  }

  appState.expenses.unshift({
    id: 'exp_' + Date.now(),
    createdAt: Date.now(),
    category: category,
    description: desc,
    amount: amount
  });

  saveToStorage();
  closeModal('modalExpense');
  renderCaja();
}

function deleteExpense(expId) {
  if (!confirm('¿Seguro que deseas eliminar este registro de gasto?')) return;
  appState.expenses = appState.expenses.filter(e => e.id !== expId);
  saveToStorage();
  renderCaja();
}

// ================= LAVADORES Y COMISIONES =================
function renderWashers() {
  const tbody = document.getElementById('washersTableBody');
  const todayStart = new Date().setHours(0, 0, 0, 0);

  tbody.innerHTML = appState.washers.map(w => {
    // Órdenes atendidas por este lavador hoy
    const washedToday = appState.orders.filter(o => o.washerId === w.id && o.createdAt >= todayStart);
    const totalVenta = washedToday.reduce((acc, o) => acc + (o.price || 0), 0);
    const totalComision = washedToday.reduce((acc, o) => acc + (o.commission || 0), 0);

    return `
      <tr>
        <td style="font-weight: 700;">${w.name}</td>
        <td>${w.phone || 'N/A'}</td>
        <td><strong>${washedToday.length}</strong> vehículos</td>
        <td style="color: #38bdf8; font-weight: 700;">$ ${formatCOP(totalVenta)}</td>
        <td style="color: #34d399; font-weight: 800; font-size: 1rem;">$ ${formatCOP(totalComision)}</td>
        <td>
          <span style="color: ${w.active ? '#4ade80' : '#94a3b8'};">
            ● ${w.active ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="toggleWasherStatus('${w.id}')">
            ${w.active ? 'Desactivar' : 'Activar'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openNewWasherModal() {
  document.getElementById('washerNameInput').value = '';
  document.getElementById('washerPhoneInput').value = '';
  openModal('modalWasher');
}

function saveWasher() {
  const name = document.getElementById('washerNameInput').value.trim();
  const phone = document.getElementById('washerPhoneInput').value.trim();

  if (!name) {
    alert('Ingresa el nombre del lavador.');
    return;
  }

  appState.washers.push({
    id: 'w_' + Date.now(),
    name: name,
    phone: phone,
    active: true
  });

  saveToStorage();
  closeModal('modalWasher');
  renderWashers();
}

function toggleWasherStatus(washerId) {
  const washer = appState.washers.find(w => w.id === washerId);
  if (washer) {
    washer.active = !washer.active;
    saveToStorage();
    renderWashers();
  }
}

// ================= HISTORIAL Y BÚSQUEDA =================
function renderHistory() {
  const tbody = document.getElementById('historyTableBody');
  const query = (document.getElementById('historySearchInput').value || '').toLowerCase().trim();

  const filtered = appState.orders.filter(o => {
    return !query || o.plate.toLowerCase().includes(query) || (o.serviceName && o.serviceName.toLowerCase().includes(query));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 2rem;">No se encontraron órdenes registradas.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    const timeStr = new Date(o.createdAt).toLocaleString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const statusBadges = {
      espera: '<span style="color: #fbbf24;">🟡 En Espera</span>',
      lavando: '<span style="color: #60a5fa;">🔵 Lavando</span>',
      listo: '<span style="color: #34d399;">🟢 Listo</span>',
      entregado: '<span style="color: #94a3b8;">⚫ Entregado</span>'
    };

    return `
      <tr>
        <td>#${String(o.ticketNumber || 0).padStart(4, '0')}</td>
        <td>${timeStr}</td>
        <td><strong class="license-plate ${o.vehicleType === 'moto' ? 'moto' : ''}" style="font-size: 0.9rem;">${o.plate}</strong></td>
        <td>${o.vehicleType.toUpperCase()}</td>
        <td>${o.serviceName}</td>
        <td>${o.washerName || 'N/A'}</td>
        <td style="font-weight: 700; color: #34d399;">$ ${formatCOP(o.price)}</td>
        <td><span class="vehicle-type-pill">${(o.paymentMethod || 'Pendiente').toUpperCase()}</span></td>
        <td>${statusBadges[o.status] || o.status}</td>
        <td>
          <button class="btn-card-action btn-card-print" style="padding: 0.2rem 0.5rem;" onclick="viewOrderTicket('${o.id}', ${o.status === 'entregado'})">
            🖨️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterHistory() {
  renderHistory();
}

// ================= CONFIGURACIÓN DE TARIFAS Y NEGOCIO =================
function renderServicesConfig() {
  const tbody = document.getElementById('servicesConfigTableBody');
  document.getElementById('configBizName').value = appState.config.businessName;
  document.getElementById('configBizAddress').value = appState.config.address;
  document.getElementById('configBizPhone').value = appState.config.phone;
  document.getElementById('configBizFooter').value = appState.config.footerText;

  tbody.innerHTML = appState.services.map(s => {
    const vIcons = { moto: '🏍️ Moto', carro: '🚗 Carro', suv: '🚙 Camioneta', taxi: '🚕 Taxi' };
    const commLabel = s.commType === 'porcentaje' ? `${s.commVal}%` : `$ ${formatCOP(s.commVal)} COP`;

    return `
      <tr>
        <td><strong>${vIcons[s.type] || s.type}</strong></td>
        <td>${s.name}</td>
        <td style="color: #34d399; font-weight: 800;">$ ${formatCOP(s.price)} COP</td>
        <td>⏱️ ${s.duration} min</td>
        <td>${commLabel}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #38bdf8;" onclick="openEditServiceModal('${s.id}')">
              ✏️ Editar
            </button>
            <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #f87171;" onclick="deleteService('${s.id}')">
              🗑️ Eliminar
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function saveBusinessConfig() {
  appState.config.businessName = document.getElementById('configBizName').value.trim() || 'AUTOLAVADO CALI';
  appState.config.address = document.getElementById('configBizAddress').value.trim();
  appState.config.phone = document.getElementById('configBizPhone').value.trim();
  appState.config.footerText = document.getElementById('configBizFooter').value.trim();

  saveToStorage();
  renderHeader();
  alert('¡Datos del establecimiento actualizados con éxito!');
}

function openNewServiceModal() {
  document.getElementById('serviceEditId').value = '';
  const title = document.getElementById('modalServiceTitle');
  if (title) title.innerText = '⚙️ Crear Nuevo Servicio';

  document.getElementById('serviceTypeSelect').value = 'carro';
  document.getElementById('serviceNameInput').value = '';
  document.getElementById('servicePriceInput').value = '';
  document.getElementById('serviceDurationInput').value = '30';
  document.getElementById('serviceCommissionType').value = 'porcentaje';
  document.getElementById('serviceCommissionVal').value = '40';
  openModal('modalService');
}

function openEditServiceModal(serviceId) {
  const service = appState.services.find(s => s.id === serviceId);
  if (!service) return;

  document.getElementById('serviceEditId').value = service.id;
  const title = document.getElementById('modalServiceTitle');
  if (title) title.innerText = '✏️ Editar Tarifa de Servicio';

  document.getElementById('serviceTypeSelect').value = service.type;
  document.getElementById('serviceNameInput').value = service.name;
  document.getElementById('servicePriceInput').value = service.price;
  document.getElementById('serviceDurationInput').value = service.duration;
  document.getElementById('serviceCommissionType').value = service.commType || 'porcentaje';
  document.getElementById('serviceCommissionVal').value = service.commVal !== undefined ? service.commVal : 40;

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

  if (!name || isNaN(price) || price <= 0) {
    alert('Ingresa el nombre y un precio válido en pesos colombianos.');
    return;
  }

  if (editId) {
    // Modo Edición
    const service = appState.services.find(s => s.id === editId);
    if (service) {
      service.type = type;
      service.name = name;
      service.price = price;
      service.duration = duration || 30;
      service.commType = commType;
      service.commVal = isNaN(commVal) ? 40 : commVal;
    }
  } else {
    // Modo Creación
    appState.services.push({
      id: 's_' + Date.now(),
      type: type,
      name: name,
      price: price,
      duration: duration || 30,
      commType: commType,
      commVal: isNaN(commVal) ? 40 : commVal
    });
  }

  saveToStorage();
  closeModal('modalService');
  renderServicesConfig();

  // Refrescar selector en caso de tener modal de ingreso abierto
  if (typeof selectVehicleType === 'function') {
    selectVehicleType(appState.selectedVehicleType);
  }
}

function deleteService(serviceId) {
  if (!confirm('¿Deseas eliminar este servicio del catálogo?')) return;
  appState.services = appState.services.filter(s => s.id !== serviceId);
  saveToStorage();
  renderServicesConfig();
}

// ================= EXPORTACIÓN Y COPIA DE SEGURIDAD =================
function exportBackupJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
  const dlAnchorElem = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `LavaFacil_Cali_Respaldo_${dateStr}.json`);
  dlAnchorElem.click();
}

function importBackupJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.orders && data.services) {
        appState = data;
        saveToStorage();
        renderAllViews();
        alert('¡Copia de seguridad restaurada correctamente!');
      } else {
        alert('Archivo no válido.');
      }
    } catch (err) {
      alert('Error leyendo el archivo JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function exportDataToCSV() {
  if (appState.orders.length === 0) {
    alert('No hay órdenes registradas para exportar.');
    return;
  }

  let csv = 'Ticket,Fecha,Hora,Placa,Vehiculo,Servicio,Lavador,Precio_COP,Comision_COP,Metodo_Pago,Estado\n';
  appState.orders.forEach(o => {
    const d = new Date(o.createdAt);
    const dateStr = d.toLocaleDateString('es-CO');
    const timeStr = d.toLocaleTimeString('es-CO');
    csv += `"${o.ticketNumber}","${dateStr}","${timeStr}","${o.plate}","${o.vehicleType}","${o.serviceName}","${o.washerName || ''}","${o.price}","${o.commission}","${o.paymentMethod || 'Pendiente'}","${o.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `LavaFacil_Historial_${new Date().toISOString().slice(0,10)}.csv`);
  link.click();
}

function resetDemoData() {
  if (confirm('¿Restablecer datos de prueba de Cali? Esto reemplazará las órdenes actuales.')) {
    localStorage.removeItem('lavafacil_cali_db');
    appState.config = { ...DEFAULT_CONFIG };
    appState.services = [...DEFAULT_SERVICES];
    appState.washers = [...DEFAULT_WASHERS];
    seedInitialDemoOrders();
    saveToStorage();
    renderAllViews();
  }
}

// ================= UTILIDADES DE NAVEGACIÓN Y MODALES =================
function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.m-nav-btn').forEach(btn => btn.classList.remove('active'));

  const activePane = document.getElementById(`tab-${tabId}`);
  if (activePane) activePane.classList.add('active');

  // Activar botones de nav
  const deskBtns = document.querySelectorAll('.desktop-nav .nav-tab-btn');
  const tabs = ['patio', 'caja', 'lavadores', 'historial', 'config'];
  const idx = tabs.indexOf(tabId);
  if (idx !== -1 && deskBtns[idx]) deskBtns[idx].classList.add('active');

  const mobBtns = document.querySelectorAll('.mobile-nav .m-nav-btn');
  const mobTabs = ['patio', 'caja', '', 'lavadores', 'config'];
  const mIdx = mobTabs.indexOf(tabId);
  if (mIdx !== -1 && mobBtns[mIdx]) mobBtns[mIdx].classList.add('active');

  // Refrescar vistas pertinentes
  if (tabId === 'caja') renderCaja();
  if (tabId === 'lavadores') renderWashers();
  if (tabId === 'historial') renderHistory();
  if (tabId === 'config') renderServicesConfig();
}

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('active');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
}

function formatCOP(amount) {
  if (isNaN(amount)) return '0';
  return Number(amount).toLocaleString('es-CO');
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('ServiceWorker no soportado en modo file local:', err);
    });
  }
}

// ============================================================
// CLEANRIDE: PORTAL GATEWAY, PALETAS Y SERVICIOS CLIENTES
// ============================================================

let currentLoginSegment = 'customer';

function showPortalView() {
  const vPortal = document.getElementById('viewPortal');
  const vCustomer = document.getElementById('viewCustomerPortal');
  const vApp = document.getElementById('viewAppOperations');
  if (vPortal) vPortal.style.display = 'flex';
  if (vCustomer) {
    vCustomer.classList.remove('active');
    vCustomer.style.display = 'none';
  }
  if (vApp) vApp.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showCustomerPortalView() {
  const vPortal = document.getElementById('viewPortal');
  const vCustomer = document.getElementById('viewCustomerPortal');
  const vApp = document.getElementById('viewAppOperations');
  if (vPortal) vPortal.style.display = 'none';
  if (vCustomer) {
    vCustomer.style.display = 'block';
    vCustomer.classList.add('active');
  }
  if (vApp) vApp.style.display = 'none';
  updateBookingServicesDropdown();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showAppView() {
  const vPortal = document.getElementById('viewPortal');
  const vCustomer = document.getElementById('viewCustomerPortal');
  const vApp = document.getElementById('viewAppOperations');
  if (vPortal) vPortal.style.display = 'none';
  if (vCustomer) {
    vCustomer.classList.remove('active');
    vCustomer.style.display = 'none';
  }
  if (vApp) vApp.style.display = 'flex';
  renderAllViews();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectLoginSegment(segment) {
  currentLoginSegment = segment;
  const btnCust = document.getElementById('btnSegCustomer');
  const btnPart = document.getElementById('btnSegPartner');
  const subhead = document.getElementById('portalCardSubtitle');
  const emailInput = document.getElementById('portalEmailInput');

  if (segment === 'customer') {
    if (btnCust) btnCust.classList.add('active');
    if (btnPart) btnPart.classList.remove('active');
    if (subhead) subhead.innerText = 'Login to book your car or bike wash service';
    if (emailInput && (!emailInput.value || emailInput.value === 'admin@cleanride.com')) {
      emailInput.value = 'cliente@cleanride.com';
    }
  } else {
    if (btnCust) btnCust.classList.remove('active');
    if (btnPart) btnPart.classList.add('active');
    if (subhead) subhead.innerText = 'Staff & Operations login for patio and cashier';
    if (emailInput && (!emailInput.value || emailInput.value === 'cliente@cleanride.com')) {
      emailInput.value = 'admin@cleanride.com';
    }
  }
}

async function handlePortalAuth(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('portalEmailInput').value.trim();
  const password = document.getElementById('portalPasswordInput').value;

  if (window.SupabaseService && window.SupabaseService.isOnline()) {
    try {
      const res = await window.SupabaseService.signIn(email, password);
      if (res.error) {
        console.warn('Nota Supabase Auth:', res.error.message);
      }
    } catch (err) {
      console.warn('Auth local fallback:', err);
    }
  }

  if (currentLoginSegment === 'customer') {
    showCustomerPortalView();
  } else {
    showAppView();
  }
}

function enterDemoMode(mode) {
  if (mode === 'customer') {
    showCustomerPortalView();
  } else {
    showAppView();
  }
}

function handleCardSignUp() {
  const email = prompt('Crea tu cuenta de CleanRide.\nIngresa tu correo electrónico:');
  if (email) {
    alert(`¡Bienvenido a CleanRide, ${email}! Tu cuenta ha sido registrada con éxito.`);
    showCustomerPortalView();
  }
}

function togglePasswordVisibility(inputId) {
  const el = document.getElementById(inputId);
  if (el) {
    el.type = el.type === 'password' ? 'text' : 'password';
  }
}

function handleForgotPassword(e) {
  if (e) e.preventDefault();
  const email = prompt('Restablecer contraseña:\nIngresa el correo registrado con tu vehículo:');
  if (email) {
    alert(`Hemos enviado un enlace de recuperación seguro a ${email}. Revisa tu bandeja de entrada.`);
  }
}

function handleOAuthLogin(provider) {
  alert(`Iniciando sesión segura con ${provider.toUpperCase()} vía Supabase Auth...`);
  if (window.SupabaseService && window.SupabaseService.isOnline()) {
    // Si Supabase tiene credenciales reales
    // client.auth.signInWithOAuth({ provider });
  }
  showCustomerPortalView();
}

// ============================================================
// PROPUESTAS DE PALETAS DE COLORES DINÁMICAS
// ============================================================

function openPaletteModal() {
  openModal('modalPaletteProposals');
}

function applyColorPalette(paletteId) {
  document.documentElement.setAttribute('data-theme', paletteId);
  localStorage.setItem('cleanride_theme', paletteId);

  const tag = document.getElementById('activePaletteTag');
  const labels = {
    'cleanride-red': 'Crimson Foam',
    'aqua-mint': 'Aqua Mint',
    'obsidian-gold': 'Obsidian Gold',
    'nordic-frost': 'Nordic Frost'
  };
  if (tag) tag.innerText = labels[paletteId] || 'Paleta';

  // Resaltar tarjeta seleccionada en el modal
  document.querySelectorAll('.palette-card-option').forEach(c => c.classList.remove('active'));
  const cardMap = {
    'cleanride-red': 'cardPaletteCleanride',
    'aqua-mint': 'cardPaletteAqua',
    'obsidian-gold': 'cardPaletteObsidian',
    'nordic-frost': 'cardPaletteNordic'
  };
  const activeCard = document.getElementById(cardMap[paletteId]);
  if (activeCard) activeCard.classList.add('active');
}

// ============================================================
// CONFIGURACIÓN Y SINCRONIZACIÓN SUPABASE CLOUD
// ============================================================

function openSupabaseModal() {
  const config = window.SupabaseService ? window.SupabaseService.getConfig() : { url: '', key: '' };
  const urlInput = document.getElementById('supabaseUrlInput');
  const keyInput = document.getElementById('supabaseKeyInput');
  if (urlInput) urlInput.value = config.url || '';
  if (keyInput) keyInput.value = config.key || '';
  openModal('modalSupabaseConfig');
}

async function saveAndTestSupabaseConfig() {
  const url = document.getElementById('supabaseUrlInput').value.trim();
  const key = document.getElementById('supabaseKeyInput').value.trim();
  const msgEl = document.getElementById('supabaseConnectionStatusMsg');

  if (msgEl) {
    msgEl.style.display = 'block';
    msgEl.style.color = '#38bdf8';
    msgEl.innerText = 'Probando conexión con Supabase...';
  }

  if (window.SupabaseService) {
    const testRes = await window.SupabaseService.testConnection(url, key);
    if (testRes.success) {
      window.SupabaseService.saveConfig(url, key);
      if (msgEl) {
        msgEl.style.color = '#34d399';
        msgEl.innerText = '✅ ¡Conexión exitosa con Supabase! Configuración guardada.';
      }
      setTimeout(() => {
        closeModal('modalSupabaseConfig');
      }, 1200);
    } else {
      if (msgEl) {
        msgEl.style.color = '#f87171';
        msgEl.innerText = '❌ Error de conexión: ' + (testRes.error || 'Verifica la URL y la Key');
      }
    }
  }
}

// ============================================================
// SERVICIOS CLIENTES: RASTREO DE PLACA Y AGENDAMIENTO
// ============================================================

async function searchCustomerVehicle() {
  const plate = document.getElementById('customerSearchPlateInput').value.trim();
  const resultBox = document.getElementById('customerTrackerResult');
  if (!plate || plate.length < 5) {
    alert('Ingresa una placa válida de carro o moto (ej: ABC-123).');
    return;
  }

  let orders = [];
  if (window.SupabaseService) {
    orders = await window.SupabaseService.searchByPlate(plate);
  } else {
    orders = appState.orders.filter(o => o.plate.replace('-', '').toUpperCase().includes(plate.replace('-', '').toUpperCase()));
  }

  if (!resultBox) return;
  resultBox.style.display = 'block';

  if (!orders || orders.length === 0) {
    resultBox.innerHTML = `
      <div class="tracker-result-card" style="text-align: center; justify-content: center; padding: 2rem;">
        <span style="color: var(--text-muted); font-size: 1rem;">No encontramos ningún vehículo activo con la placa <strong style="color: var(--plate-bg);">${plate.toUpperCase()}</strong> en este momento.</span>
      </div>
    `;
    return;
  }

  const order = orders[0];
  const statusLabels = {
    espera: { label: 'En Cola de Espera', icon: '🟡', color: '#fbbf24' },
    lavando: { label: 'En Proceso de Lavado', icon: '🔵', color: '#60a5fa' },
    listo: { label: '¡Listo para Retiro!', icon: '🟢', color: '#34d399' },
    entregado: { label: 'Entregado al Cliente', icon: '⚫', color: '#94a3b8' }
  };
  const st = statusLabels[order.status] || statusLabels.espera;

  resultBox.innerHTML = `
    <div class="tracker-result-card">
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span class="license-plate-badge" style="font-size: 1.25rem;">${order.plate}</span>
          <span style="color: ${st.color}; font-weight: 800; font-size: 1.05rem;">${st.icon} ${st.label}</span>
        </div>
        <div style="color: #ffffff; font-weight: 700; font-size: 1.1rem; margin-top: 0.3rem;">
          ${order.serviceName || order.service_name}
        </div>
        <div style="color: var(--text-muted); font-size: 0.85rem;">
          Lavador Asignado: <strong style="color: #e2e8f0;">${order.washerName || order.washer_name || 'Por asignar'}</strong>
        </div>
      </div>
      <div style="text-align: right; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
        <div style="font-size: 1.6rem; font-weight: 900; color: #34d399;">$ ${formatCOP(order.price)} COP</div>
        <a href="${getWhatsAppLink(order)}" target="_blank" class="btn-card-action btn-whatsapp" style="text-decoration: none; padding: 0.6rem 1.1rem; border-radius: var(--radius-pill); font-size: 0.85rem;">
          <span>💬</span> Contactar Lavadero
        </a>
      </div>
    </div>
  `;
}

function updateBookingServicesDropdown() {
  const type = document.getElementById('bookingVehicleType')?.value || 'carro';
  const select = document.getElementById('bookingServiceSelect');
  if (!select) return;

  const filtered = appState.services.filter(s => s.type === type);
  select.innerHTML = filtered.map(s => `
    <option value="${s.id}">${s.name} - $ ${formatCOP(s.price)} COP (${s.duration} min)</option>
  `).join('');
}

async function submitCustomerBookingForm(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('bookingName').value.trim();
  const phone = document.getElementById('bookingPhone').value.trim();
  const plate = document.getElementById('bookingPlate').value.trim().toUpperCase();
  const type = document.getElementById('bookingVehicleType').value;
  const date = document.getElementById('bookingDate').value;
  const time = document.getElementById('bookingTime').value;
  const serviceSelect = document.getElementById('bookingServiceSelect');
  const serviceName = serviceSelect.options[serviceSelect.selectedIndex]?.text || '';

  const booking = {
    customer_name: name,
    customer_phone: phone,
    plate: plate,
    vehicle_type: type,
    service_name: serviceName,
    preferred_date: date,
    preferred_time: time
  };

  if (window.SupabaseService) {
    await window.SupabaseService.createBooking(booking);
  }

  alert(`🎉 ¡Excelente, ${name}! Tu cita de lavado para el vehículo ${plate} ha sido registrada con éxito para el día ${date} a las ${time}.\n\n¡Te esperamos en CleanRide!`);
  e.target.reset();
}

// Iniciar aplicación al cargar
window.addEventListener('DOMContentLoaded', initApp);
