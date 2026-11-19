/**
 * WashQ / KodiQuett — Configuración y Plantillas Predeterminadas
 * Define los planes de licencia, tenants iniciales, catálogo y estructura base de appState.
 */

const DEFAULT_TENANTS = [
      {
        id: 'cali-express',
        code: 'CALI-01',
        name: 'Autolavado Cali Express',
        city: 'Cali',
        address: 'Calle 5 # 38-20, Cali - Valle',
        phone: '317 015 4654',
        ownerPhone: '315 555 1234',
        active: true,
        adminPin: '1234',
        cajeroPin: '0000',
        washType: 'mixto'
      }
    ];

    let tenantsRegistry = [];
    let activeTenant = null;
    let selectedAuthRole = 'admin';

    // ==========================================================================
    // SISTEMA CENTRAL DE LICENCIAS KODIQUETT (EXPRESS / PRO / ÉLITE)
    // ==========================================================================
    const PLAN_TIERS = {
      express: {
        id: 'express',
        name: 'WashQ Express',
        badge: 'Plan Express',
        allowMultiSede: false,
        maxTenants: 1,
        maxWashers: 5,
        allowThermalPrinter: false,
        description: 'Plan Express (1 Sede, Hasta 5 Operarios, Caja Esencial)'
      },
      pro: {
        id: 'pro',
        name: 'WashQ Pro',
        badge: 'Plan Pro',
        allowMultiSede: false,
        maxTenants: 1,
        maxWashers: 999,
        allowThermalPrinter: false,
        description: 'Plan Pro (1 Sede, Operarios Ilimitados, Cuadre WhatsApp)'
      },
      elite: {
        id: 'elite',
        name: 'WashQ Élite',
        badge: 'Plan Élite (Multi-Sede)',
        allowMultiSede: true,
        maxTenants: 999,
        maxWashers: 999,
        allowThermalPrinter: true,
        description: 'Plan Élite Vitalicio (Multi-Sede, Operarios Ilimitados, Impresora POS)'
      }
    };



    const DEFAULT_CONFIG = {
      businessName: 'WASHQ &bull; AUTOLAVADO EXPRESS',
      address: 'Calle 5 # 38-20, Cali - Valle',
      phone: '317 015 4654',
      ownerPhone: '315 555 1234',
      footerText: '¡Gracias por su visita! Cuidamos su vehículo.',
      lockTimeoutMinutes: 5,
      washType: 'mixto'
    };

    const DEFAULT_SERVICES = [
      { id: 's_m1', type: 'moto', name: 'Lavado Sencillo Moto', price: 12000, duration: 20, commType: 'porcentaje', commVal: 40 },
      { id: 's_m2', type: 'moto', name: 'Lavado Especial + Silicona', price: 18000, duration: 30, commType: 'porcentaje', commVal: 40 },
      { id: 's_m3', type: 'moto', name: 'Desengrase Motor + Detailing', price: 32000, duration: 45, commType: 'porcentaje', commVal: 40 },
      { id: 's_c1', type: 'carro', name: 'Lavado Sencillo (Solo Por Fuera)', price: 18000, duration: 25, commType: 'porcentaje', commVal: 40 },
      { id: 's_c2', type: 'carro', name: 'Lavado General (Interior + Exterior)', price: 26000, duration: 40, commType: 'porcentaje', commVal: 40 },
      { id: 's_c3', type: 'carro', name: 'Lavado Full + Motor + Chasis', price: 45000, duration: 60, commType: 'porcentaje', commVal: 40 },
      { id: 's_suv1', type: 'suv', name: 'Lavado General SUV / Camioneta', price: 35000, duration: 50, commType: 'porcentaje', commVal: 40 },
      { id: 's_suv2', type: 'suv', name: 'Lavado Full + Motor SUV', price: 60000, duration: 75, commType: 'porcentaje', commVal: 40 },
      { id: 's_t1', type: 'taxi', name: 'Lavado Exprés Taxi', price: 16000, duration: 20, commType: 'porcentaje', commVal: 40 }
    ];

    const DEFAULT_WASHERS = [
      { id: 'w_1', name: 'Carlos Murillo', phone: '312 456 7890', pin: '1111', active: true },
      { id: 'w_2', name: 'Andrés Valencia', phone: '318 654 3210', pin: '2222', active: true },
      { id: 'w_3', name: 'Jhon Alexander Gómez', phone: '310 987 6543', pin: '3333', active: true }
    ];

    const DEFAULT_PAYMENT_METHODS = [
      { id: 'pm_efectivo', name: 'Efectivo', icon: 'efectivo' },
      { id: 'pm_nequi', name: 'Nequi', icon: 'nequi' },
      { id: 'pm_daviplata', name: 'Daviplata', icon: 'daviplata' },
      { id: 'pm_transf', name: 'Bancolombia Transferencia', icon: 'bancolombia' }
    ];

    const DEFAULT_EXPENSE_CATEGORIES = [
      'Insumos de Lavado',
      'Alimentación & Refrigerios',
      'Mantenimiento de Máquinas',
      'Servicios Públicos',
      'Arriendo del Local / Lote',
      'Nómina Fija',
      'Publicidad & Redes',
      'Varios / Imprevistos'
    ];

    const DEFAULT_ROLES = [
      { id: 'admin', name: 'Administrador', icon: 'admin', pin: '1234' },
      { id: 'cajero', name: 'Cajero', icon: 'cajero', pin: '0000' },
      { id: 'operario', name: 'Operario', icon: 'operario', pin: '' }
    ];

    // Estado Global
    let appState = {
      config: { ...DEFAULT_CONFIG },
      services: [...DEFAULT_SERVICES],
      washers: [...DEFAULT_WASHERS],
      paymentMethods: [...DEFAULT_PAYMENT_METHODS],
      expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
      roles: [...DEFAULT_ROLES],
      currentRole: 'admin',
      pendingRoleSwitch: null,
      orders: [],
      expenses: [],
      selectedVehicleType: 'carro',
      selectedServiceId: null
    };
