/**
 * API Serverless de Activación de Licencias WashQ (Vercel)
 * Valida los códigos de licencia y activa las capacidades del sistema según el plan:
 * - express: 1 sede, hasta 5 operarios, caja esencial
 * - pro: 1 sede, operarios ilimitados, arqueo WhatsApp, reportes avanzados
 * - elite: Multi-Sede (botón + Nueva Sede habilitado), operarios ilimitados, impresora POS
 */

module.exports = (req, res) => {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const code = (req.query.code || (req.body && req.body.code) || '').trim().toUpperCase();

  if (!code) {
    return res.status(400).json({
      ok: false,
      error: 'Por favor proporciona un código de licencia válido.'
    });
  }

  // Registro de licencias oficiales emitidas por Kodiquett
  const LICENSES = {
    // Oferta de Lanzamiento: Primeros 5 Autolavados (Plan Élite Completo)
    'KODI-ELITE-FUNDADOR': {
      plan: 'elite',
      client: 'Autolavado Fundador (Promoción Lanzamiento)',
      maxTenants: 99,
      maxWashers: 999
    },
    'KODI-CALI-01': {
      plan: 'elite',
      client: 'Autolavado Cali Express (Sede Principal)',
      maxTenants: 99,
      maxWashers: 999
    },

    // Planes Express
    'WASHQ-EXP-01': {
      plan: 'express',
      client: 'Cliente 01 - Plan Express',
      maxTenants: 1,
      maxWashers: 5
    },
    'WASHQ-EXP-02': {
      plan: 'express',
      client: 'Cliente 02 - Plan Express',
      maxTenants: 1,
      maxWashers: 5
    },

    // Planes Pro
    'WASHQ-PRO-01': {
      plan: 'pro',
      client: 'Cliente 01 - Plan Pro',
      maxTenants: 1,
      maxWashers: 999
    },
    'WASHQ-PRO-02': {
      plan: 'pro',
      client: 'Cliente 02 - Plan Pro',
      maxTenants: 1,
      maxWashers: 999
    },

    // Planes Élite
    'WASHQ-ELITE-01': {
      plan: 'elite',
      client: 'Cliente 01 - Plan Élite',
      maxTenants: 99,
      maxWashers: 999
    },
    'WASHQ-ELITE-02': {
      plan: 'elite',
      client: 'Cliente 02 - Plan Élite',
      maxTenants: 99,
      maxWashers: 999
    }
  };

  const license = LICENSES[code];

  if (!license) {
    return res.status(404).json({
      ok: false,
      error: 'El código de licencia ingresado no existe o no ha sido activado por Kodiquett.'
    });
  }

  // Firma simple de verificación
  const signature = Buffer.from(`${code}:${license.plan}:${license.client}:KODIQUETT_WASHQ_2026`).toString('base64');

  return res.status(200).json({
    ok: true,
    code,
    plan: license.plan,
    client: license.client,
    maxTenants: license.maxTenants,
    maxWashers: license.maxWashers,
    signature,
    activatedAt: new Date().toISOString()
  });
};
