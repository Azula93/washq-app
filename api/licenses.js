/**
 * API Central de Licencias y Autolavados Kodiquett (Vercel & Servidor Local)
 * Permite:
 * 1. A la App del Cliente: Consultar silenciosamente su plan por código de sede (ej: CALI-01)
 * 2. A la Propietaria (Master): Ver todos los autolavados, registrar nuevos y cambiar planes con historial.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'licenses.json');
const MASTER_KEY_DEFAULT = 'kodi2026'; // Clave maestra de la propietaria

// Memoria caché para entornos serverless (Vercel)
let memoryStore = null;

function loadStore() {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      memoryStore = JSON.parse(raw);
      return memoryStore;
    }
  } catch (e) {
    console.warn('[Licenses API] Error leyendo data/licenses.json:', e.message);
  }

  // Semilla por defecto si no existe archivo
  memoryStore = {
    tenants: {
      'CALI-01': {
        code: 'CALI-01',
        name: 'Autolavado Cali Express',
        city: 'Cali',
        ownerPhone: '315 555 1234',
        plan: 'elite',
        status: 'active',
        createdAt: '2026-11-15T00:00:00.000Z',
        history: [
          {
            date: '2026-11-15T00:00:00.000Z',
            action: 'created',
            plan: 'elite',
            note: 'Cupo de Lanzamiento Fundador (Sistema Completo Desbloqueado)'
          }
        ]
      }
    }
  };
  return memoryStore;
}

function saveStore(data) {
  memoryStore = data;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Licenses API] Aviso: No se pudo persistir a disco (común en serverless read-only):', e.message);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const store = loadStore();
  const masterSecret = process.env.MASTER_ADMIN_KEY || MASTER_KEY_DEFAULT;

  // 1. CONSULTA PÚBLICA / CLIENTE: Consulta de plan por código de sede (ej: ?tenant=CALI-01)
  if (req.method === 'GET' && req.query.tenant) {
    const tenantCode = String(req.query.tenant).trim().toUpperCase();
    const tenant = store.tenants[tenantCode];

    if (!tenant) {
      // Si la sede no está registrada aún, responde plan de contingencia (Express o Fundador)
      return res.status(200).json({
        ok: true,
        found: false,
        code: tenantCode,
        plan: 'elite', // Por defecto los primeros clientes disfrutan del sistema completo
        maxTenants: 99,
        maxWashers: 999,
        note: 'Sede no registrada en base central. Operando en modo Élite de cortesía.'
      });
    }

    const maxTenants = tenant.plan === 'elite' ? 99 : 1;
    const maxWashers = tenant.plan === 'express' ? 5 : 999;

    return res.status(200).json({
      ok: true,
      found: true,
      code: tenant.code,
      name: tenant.name,
      city: tenant.city,
      plan: tenant.plan,
      maxTenants,
      maxWashers,
      status: tenant.status || 'active',
      verifiedAt: new Date().toISOString()
    });
  }

  // 2. CONSULTA PRIVADA MASTER: Ver todos los autolavados y estadísticas
  if (req.method === 'GET' && req.query.masterKey) {
    if (req.query.masterKey !== masterSecret) {
      return res.status(403).json({ ok: false, error: 'Clave maestra inválida' });
    }

    const list = Object.values(store.tenants);
    const stats = {
      total: list.length,
      elite: list.filter(t => t.plan === 'elite').length,
      pro: list.filter(t => t.plan === 'pro').length,
      express: list.filter(t => t.plan === 'express').length
    };

    return res.status(200).json({
      ok: true,
      tenants: store.tenants,
      stats,
      serverTime: new Date().toISOString()
    });
  }

  // 3. OPERACIONES MASTER: Registrar autolavado o Cambiar plan
  if (req.method === 'POST') {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) {}
    }

    if (body.masterKey !== masterSecret) {
      return res.status(403).json({ ok: false, error: 'Acceso no autorizado: clave maestra inválida' });
    }

    const action = body.action;

    // A) CREAR NUEVO AUTOLAVADO
    if (action === 'createTenant') {
      const code = String(body.code || '').trim().toUpperCase();
      const name = String(body.name || '').trim();
      const city = String(body.city || 'Cali').trim();
      const ownerPhone = String(body.ownerPhone || '').trim();
      const plan = ['express', 'pro', 'elite'].includes(body.plan) ? body.plan : 'elite';

      if (!code || !name) {
        return res.status(400).json({ ok: false, error: 'Código de sede y nombre de autolavado son obligatorios' });
      }

      if (store.tenants[code]) {
        return res.status(400).json({ ok: false, error: `Ya existe un autolavado con el código "${code}"` });
      }

      const now = new Date().toISOString();
      const newTenant = {
        code,
        name,
        city,
        ownerPhone,
        plan,
        status: 'active',
        createdAt: now,
        history: [
          {
            date: now,
            action: 'created',
            plan,
            note: body.note || 'Registro inicial por Kodiquett Master'
          }
        ]
      };

      store.tenants[code] = newTenant;
      saveStore(store);

      return res.status(200).json({ ok: true, tenant: newTenant });
    }

    // B) CAMBIAR PLAN DE UN AUTOLAVADO (UPGRADE / DOWNGRADE)
    if (action === 'updatePlan') {
      const code = String(body.code || '').trim().toUpperCase();
      const newPlan = body.newPlan;
      const note = body.note || 'Actualización de plan por Kodiquett';

      if (!store.tenants[code]) {
        return res.status(404).json({ ok: false, error: `El autolavado "${code}" no existe en el registro` });
      }

      if (!['express', 'pro', 'elite'].includes(newPlan)) {
        return res.status(400).json({ ok: false, error: 'Plan inválido. Debe ser express, pro o elite' });
      }

      const tenant = store.tenants[code];
      const prevPlan = tenant.plan;
      tenant.plan = newPlan;
      if (!Array.isArray(tenant.history)) tenant.history = [];

      tenant.history.unshift({
        date: new Date().toISOString(),
        action: 'plan_change',
        from: prevPlan,
        to: newPlan,
        note
      });

      saveStore(store);
      return res.status(200).json({ ok: true, tenant });
    }

    // C) EDITAR DATOS DEL AUTOLAVADO (CORREGIR ERRORES)
    if (action === 'editTenant') {
      const code = String(body.code || '').trim().toUpperCase();
      const tenant = store.tenants[code];
      if (!tenant) {
        return res.status(404).json({ ok: false, error: `El autolavado "${code}" no existe en el registro` });
      }

      const newName = body.name ? String(body.name).trim() : tenant.name;
      const newCity = body.city ? String(body.city).trim() : tenant.city;
      const newPhone = body.ownerPhone !== undefined ? String(body.ownerPhone).trim() : tenant.ownerPhone;
      const newStatus = body.status ? body.status : (tenant.status || 'active');
      const newPlan = body.plan && ['express', 'pro', 'elite'].includes(body.plan) ? body.plan : tenant.plan;
      const newCode = body.newCode ? String(body.newCode).trim().toUpperCase() : null;

      tenant.name = newName;
      tenant.city = newCity;
      tenant.ownerPhone = newPhone;
      tenant.status = newStatus;
      tenant.plan = newPlan;

      if (!Array.isArray(tenant.history)) tenant.history = [];
      tenant.history.unshift({
        date: new Date().toISOString(),
        action: 'edited',
        note: body.note || 'Datos corregidos en Consola Master'
      });

      // Si se solicitó renombrar el código de la sede
      if (newCode && newCode !== code) {
        if (store.tenants[newCode]) {
          return res.status(400).json({ ok: false, error: `El código "${newCode}" ya está en uso por otro autolavado` });
        }
        tenant.code = newCode;
        store.tenants[newCode] = tenant;
        delete store.tenants[code];
      }

      saveStore(store);
      return res.status(200).json({ ok: true, tenant });
    }

    // D) ELIMINAR AUTOLAVADO
    if (action === 'deleteTenant') {
      const code = String(body.code || '').trim().toUpperCase();
      if (!store.tenants[code]) {
        return res.status(404).json({ ok: false, error: `El autolavado "${code}" no existe` });
      }

      delete store.tenants[code];
      saveStore(store);
      return res.status(200).json({ ok: true, message: `Autolavado ${code} eliminado con éxito` });
    }

    return res.status(400).json({ ok: false, error: 'Acción no reconocida' });
  }

  return res.status(405).json({ ok: false, error: 'Método no permitido' });
};
