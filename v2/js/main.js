/**
 * KodiQuett v2 — JAVASCRIPT MODULAR
 * Control de Simulador, Precios por Pestañas, Dropdown y WhatsApp
 */

const KODIQUETT_CONFIG = {
  email: "azuladev93@gmail.com",
  whatsappNumber: "573170154654",
  messages: {
    general: "Hola KodiQuett, deseo conocer más información sobre sus sistemas de software.",
    salud: "Hola KodiQuett, me interesa agendar una demostración de DentalQ para mi consultorio.",
    wash: "Hola KodiQuett, me interesa conocer el funcionamiento y precios de WashQ para mi AutoLavado.",
    custom: "Hola KodiQuett, quisiera solicitar una cotización para un desarrollo de software a la medida."
  }
};

document.addEventListener('DOMContentLoaded', () => {
  bindWhatsAppLinks();
  initMobileMenu();
  initNavDropdown();
  initDashboardSwitcher();
  initPricingSwitcher();
  initFaqAccordion();
  initInteractiveOdontogram();
  initPatioTimers();
});

function bindWhatsAppLinks() {
  const waButtons = document.querySelectorAll('[data-wa]');
  waButtons.forEach(btn => {
    const type = btn.getAttribute('data-wa') || 'general';
    const text = KODIQUETT_CONFIG.messages[type] || KODIQUETT_CONFIG.messages.general;
    const cleanNumber = KODIQUETT_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    
    btn.setAttribute('href', url);
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener noreferrer');
  });

  const emailEls = document.querySelectorAll('[data-contact-email]');
  emailEls.forEach(el => {
    el.textContent = KODIQUETT_CONFIG.email;
    if (el.tagName === 'A') {
      el.setAttribute('href', `mailto:${KODIQUETT_CONFIG.email}`);
    }
  });
}

function initNavDropdown() {
  const dropdownToggle = document.getElementById('systemsDropdownToggle');
  const dropdownMenu = document.getElementById('systemsDropdownMenu');
  if (!dropdownToggle || !dropdownMenu) return;

  dropdownToggle.addEventListener('click', (e) => {
    e.preventDefault();
    const isVisible = dropdownMenu.classList.contains('is-visible');
    dropdownMenu.classList.toggle('is-visible', !isVisible);
    dropdownToggle.setAttribute('aria-expanded', !isVisible ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove('is-visible');
      dropdownToggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropdownMenu.classList.contains('is-visible')) {
      dropdownMenu.classList.remove('is-visible');
      dropdownToggle.setAttribute('aria-expanded', 'false');
      dropdownToggle.focus();
    }
  });
}

function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const navDrawer = document.getElementById('mobileNavDrawer');
  const closeBtn = document.getElementById('mobileMenuClose');

  if (!toggleBtn || !navDrawer) return;

  // Crear o enlazar el backdrop scrim para cierre táctil externo
  let backdrop = document.getElementById('mobileNavBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'mobileNavBackdrop';
    backdrop.className = 'mobile-nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    navDrawer.parentNode.insertBefore(backdrop, navDrawer);
  }

  toggleBtn.setAttribute('aria-controls', 'mobileNavDrawer');
  if (!toggleBtn.hasAttribute('aria-expanded')) {
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  // Sincronizar página activa (aria-current="page") automáticamente
  const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  navDrawer.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#') || href.includes('#')) return;
    const targetFile = href.split('/').pop().toLowerCase();
    if (targetFile === currentFile) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('is-active');
    }
  });

  function toggleMenu(show, restoreFocus = true) {
    const isOpen = Boolean(show);
    navDrawer.classList.toggle('is-open', isOpen);
    backdrop.classList.toggle('is-open', isOpen);
    navDrawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';

    if (isOpen) {
      if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 50);
      }
    } else if (restoreFocus) {
      toggleBtn.focus();
    }
  }

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleMenu(!isExpanded);
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => toggleMenu(false));
  }

  backdrop.addEventListener('click', () => toggleMenu(false, false));

  navDrawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false, false));
  });

  // Cerrar con tecla Escape y mantener foco atrapado (Focus Trap) dentro del drawer abierto
  document.addEventListener('keydown', (e) => {
    if (!navDrawer.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      toggleMenu(false);
      return;
    }

    if (e.key === 'Tab') {
      const focusables = navDrawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Auto-cerrar y liberar scroll si el viewport pasa a escritorio (>960px)
  const mqDesktop = window.matchMedia('(min-width: 961px)');
  const handleBreakpoint = (e) => {
    if (e.matches && navDrawer.classList.contains('is-open')) {
      toggleMenu(false, false);
    }
  };
  if (mqDesktop.addEventListener) {
    mqDesktop.addEventListener('change', handleBreakpoint);
  }
}

/**
 * Conmutador del Simulador en Vivo (Demo)
 */
function initDashboardSwitcher() {
  const btnSalud = document.getElementById('switchTabSalud');
  const btnWash = document.getElementById('switchTabWash');
  const viewSalud = document.getElementById('previewViewSalud');
  const viewWash = document.getElementById('previewViewWash');
  const urlLabel = document.getElementById('previewUrlLabel');

  if (!btnSalud || !btnWash || !viewSalud || !viewWash) return;

  btnSalud.addEventListener('click', () => {
    btnSalud.classList.add('active');
    btnWash.classList.remove('active');
    viewSalud.classList.remove('is-hidden');
    viewWash.classList.add('is-hidden');
    if (urlLabel) urlLabel.textContent = 'app.KodiQuett.com/salud/agenda';
  });

  btnWash.addEventListener('click', () => {
    btnWash.classList.add('active');
    btnSalud.classList.remove('active');
    viewWash.classList.remove('is-hidden');
    viewSalud.classList.add('is-hidden');
    if (urlLabel) urlLabel.textContent = '192.168.1.15:3000/patio (Red Local Offline)';
  });
}

/**
 * Conmutador de Esquemas de Precios Separados (Salud vs Wash)
 */
function initPricingSwitcher() {
  const btnSalud = document.getElementById('switchPriceSalud');
  const btnWash = document.getElementById('switchPriceWash');
  const viewSalud = document.getElementById('pricingViewSalud');
  const viewWash = document.getElementById('pricingViewWash');

  if (!btnSalud || !btnWash || !viewSalud || !viewWash) return;

  btnSalud.addEventListener('click', () => {
    btnSalud.classList.add('active');
    btnWash.classList.remove('active');
    viewSalud.classList.remove('is-hidden');
    viewWash.classList.add('is-hidden');
  });

  btnWash.addEventListener('click', () => {
    btnWash.classList.add('active');
    btnSalud.classList.remove('active');
    viewWash.classList.remove('is-hidden');
    viewSalud.classList.add('is-hidden');
  });
}

function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-question');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      faqItems.forEach(other => other.classList.remove('is-open'));
      if (!isOpen) {
        item.classList.add('is-open');
      }
    });
  });
}

function initInteractiveOdontogram() {
  const crossGrid = document.getElementById('odoCrossGrid');
  const toolbar = document.getElementById('odoHallazgosToolbar');
  const activeToolLabel = document.getElementById('odoActiveToolLabel');
  const activeRecordNumber = document.getElementById('odontogramSelectedTooth');
  const activeRecordStatus = document.getElementById('odontogramSelectedStatus');
  const activeRecordAction = document.getElementById('odontogramSelectedAction');

  if (crossGrid && toolbar) {
    const FINDINGS = {
      amalgama: {
        label: 'Amalgama',
        action: 'Control de restauración en amalgama',
        html: '<span class="odo-sym odo-sym-amalgama"></span>'
      },
      resina: {
        label: 'Resina',
        action: 'Restauración estética en resina fotocurada',
        html: '<span class="odo-sym odo-sym-resina"></span>'
      },
      ausente: {
        label: 'Diente Ausente',
        action: 'Evaluación de rehabilitación protésica / implante',
        html: '<span class="odo-sym odo-sym-ausente">|</span>'
      },
      endodoncia: {
        label: 'Endodoncia',
        action: 'Control radiográfico de tratamiento de conducto',
        html: '<span class="odo-sym odo-sym-endodoncia">&#9650;</span>'
      },
      corona: {
        label: 'Corona',
        action: 'Control de adaptación de corona protésica',
        html: '<span class="odo-sym odo-sym-corona"></span>'
      },
      exodoncia: {
        label: 'Exodoncia',
        action: 'Extracción dental programada',
        html: '<span class="odo-sym odo-sym-exodoncia">&#10006;</span>'
      },
      caries: {
        label: 'Caries',
        action: 'Remoción de tejido cariado + Resina',
        html: '<span class="odo-sym odo-sym-caries"></span>'
      },
      'nec-endo': {
        label: 'Necesidad de Endodoncia',
        action: 'Realizar tratamiento de conducto (Endodoncia)',
        html: '<span class="odo-sym odo-sym-nec-endo">&#9650;</span>'
      },
      'no-erup': {
        label: 'No Erupcionado',
        action: 'Seguimiento radiográfico de erupción dental',
        html: '<span class="odo-sym odo-sym-no-erup"></span>'
      },
      sano: {
        label: 'Sano (Sin hallazgos)',
        action: 'Control preventivo periódico',
        html: ''
      }
    };

    // Estado inicial idéntico a la captura de referencia del sistema real
    const initialFindings = {
      '15': 'amalgama',
      '14': 'resina',
      '13': 'ausente',
      '23': 'corona',
      '42': 'corona'
    };

    const toothSVG = `
      <svg class="odo-tooth-svg" viewBox="0 0 24 26" aria-hidden="true">
        <path d="M6.5 2C3.5 2 2 4.5 2 7.8c0 2.6 1.1 4.8 1.9 7.1.7 2.1 1.1 5.2 1.7 7.6.3 1.1 1.3 1.5 2.1.7.7-.7 1.4-3.1 2.2-5.1.5-1.2 1.3-1.8 2.1-1.8s1.6.6 2.1 1.8c.8 2 1.5 4.4 2.2 5.1.8.8 1.8.4 2.1-.7.6-2.4 1-5.5 1.7-7.6.8-2.3 1.9-4.5 1.9-7.1C22 4.5 20.5 2 17.5 2c-2.1 0-3.6 1.1-5.5 1.1S8.6 2 6.5 2z"/>
      </svg>
    `;

    let currentTool = 'resina';

    // Selección de botón de Hallazgo en la barra superior
    const toolButtons = toolbar.querySelectorAll('.odo-hallazgo-btn');
    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentTool = btn.getAttribute('data-finding') || 'resina';
        const label = btn.getAttribute('data-label') || 'Resina';
        if (activeToolLabel) {
          activeToolLabel.textContent = `Herramienta activa: ${label}`;
        }
      });
    });

    // Renderizar las 52 piezas dentales en sus respectivas filas de los 4 cuadrantes
    const rows = crossGrid.querySelectorAll('.odo-row[data-row-teeth]');
    rows.forEach(row => {
      const teethList = (row.getAttribute('data-row-teeth') || '').split(',');
      row.innerHTML = '';

      teethList.forEach(num => {
        const cleanNum = num.trim();
        if (!cleanNum) return;

        const initKey = initialFindings[cleanNum] || 'sano';
        const fData = FINDINGS[initKey] || FINDINGS.sano;

        const unit = document.createElement('div');
        unit.className = 'odo-unit' + (cleanNum === '14' ? ' is-selected' : '');
        unit.setAttribute('data-tooth', cleanNum);
        unit.setAttribute('data-finding', initKey);
        unit.innerHTML = `
          ${toothSVG}
          <span class="odo-tooth-num">${cleanNum}</span>
          <div class="odo-finding-slot">${fData.html}</div>
        `;

        unit.addEventListener('click', () => {
          crossGrid.querySelectorAll('.odo-unit').forEach(u => u.classList.remove('is-selected'));
          unit.classList.add('is-selected');

          const prevFinding = unit.getAttribute('data-finding') || 'sano';
          // Si hace clic con la misma herramienta ya aplicada, la limpia a 'sano'; si no, aplica la herramienta activa
          const nextFinding = (currentTool === 'sano' || prevFinding === currentTool) ? 'sano' : currentTool;
          const nextData = FINDINGS[nextFinding] || FINDINGS.sano;

          unit.setAttribute('data-finding', nextFinding);
          const slot = unit.querySelector('.odo-finding-slot');
          if (slot) {
            slot.innerHTML = nextData.html;
          }

          if (activeRecordNumber) activeRecordNumber.textContent = `Pieza #${cleanNum}`;
          if (activeRecordStatus) {
            activeRecordStatus.innerHTML = `${nextData.html} <span>${nextData.label}</span>`;
          }
          if (activeRecordAction) activeRecordAction.textContent = nextData.action;
        });

        row.appendChild(unit);
      });
    });
  }
}

function initPatioTimers() {
  const timerElements = document.querySelectorAll('[data-timer-seconds]');
  if (!timerElements.length) return;

  setInterval(() => {
    timerElements.forEach(el => {
      let seconds = parseInt(el.getAttribute('data-timer-seconds'), 10) || 0;
      seconds++;
      el.setAttribute('data-timer-seconds', seconds);

      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      el.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    });
  }, 1000);
}
