/**
 * CleanRide - Supabase Client & Realtime Sync Engine
 * Diseñado para despliegue estático en Vercel con sincronización hacia Supabase
 * y tolerancia a fallos con modo Local-First (localStorage).
 */

const SupabaseService = (() => {
  const STORAGE_KEY = 'cleanride_supabase_config';
  let client = null;
  let isConnected = false;

  // Cargar configuración guardada o usar variables por defecto
  function getConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error leyendo config Supabase:', e);
    }
    return {
      url: window.CLEANRIDE_SUPABASE_URL || '',
      key: window.CLEANRIDE_SUPABASE_ANON_KEY || ''
    };
  }

  // Guardar configuración
  function saveConfig(url, key) {
    const config = { url: (url || '').trim(), key: (key || '').trim() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return init();
  }

  // Inicializar cliente Supabase
  function init() {
    const config = getConfig();
    if (config.url && config.key && window.supabase) {
      try {
        client = window.supabase.createClient(config.url, config.key);
        isConnected = true;
        console.log('⚡ Conectado exitosamente con Supabase Cloud:', config.url);
        updateUIStatus(true);
        return true;
      } catch (err) {
        console.error('Error al inicializar cliente Supabase:', err);
        isConnected = false;
        updateUIStatus(false);
        return false;
      }
    } else {
      isConnected = false;
      updateUIStatus(false);
      return false;
    }
  }

  function updateUIStatus(connected) {
    const badge = document.getElementById('supabaseStatusBadge');
    if (badge) {
      if (connected) {
        badge.innerHTML = '<span class="status-dot online"></span> Supabase: Online';
        badge.classList.remove('offline');
        badge.classList.add('online');
        badge.title = 'Sincronizado en la nube con Supabase (Vercel Ready)';
      } else {
        badge.innerHTML = '<span class="status-dot offline"></span> Supabase: Local / Demo';
        badge.classList.remove('online');
        badge.classList.add('offline');
        badge.title = 'Modo Local / Demo activo. Haz clic para conectar tus credenciales de Supabase';
      }
    }
  }

  // Comprobar conexión viva
  async function testConnection(testUrl, testKey) {
    if (!window.supabase) return { success: false, error: 'Librería @supabase/supabase-js no disponible' };
    try {
      const tempClient = window.supabase.createClient(testUrl, testKey);
      const { data, error } = await tempClient.from('services').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Autenticación con Supabase Auth
  async function signIn(email, password) {
    if (!client) {
      // Modo local simulado para demo
      return { data: { user: { email, role: 'authenticated' } }, error: null };
    }
    return await client.auth.signInWithPassword({ email, password });
  }

  async function signUp(email, password, metadata = {}) {
    if (!client) {
      return { data: { user: { email, ...metadata } }, error: null };
    }
    return await client.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
  }

  async function signOut() {
    if (client) {
      await client.auth.signOut();
    }
    localStorage.removeItem('cleanride_user_session');
  }

  // Operaciones de Base de Datos para Órdenes
  async function syncOrder(order) {
    if (!client) return { local: true };
    try {
      const payload = {
        id: order.id,
        plate: order.plate,
        vehicle_type: order.vehicleType,
        service_id: order.serviceId,
        service_name: order.serviceName,
        price: order.price,
        washer_id: order.washerId,
        washer_name: order.washerName,
        commission: order.commission,
        status: order.status,
        phone: order.phone,
        notes: order.notes,
        payment_method: order.paymentMethod,
        estimated_duration: order.estimatedDuration,
        created_at: new Date(order.createdAt).toISOString()
      };
      const { data, error } = await client.from('orders').upsert(payload);
      return { success: !error, error };
    } catch (err) {
      console.warn('Error sincronizando orden a Supabase:', err);
      return { success: false, error: err };
    }
  }

  async function updateOrderStatus(orderId, status) {
    if (!client) return { local: true };
    try {
      const updates = { status };
      if (status === 'lavando') updates.wash_started_at = new Date().toISOString();
      if (status === 'listo') updates.ready_at = new Date().toISOString();
      if (status === 'entregado') updates.delivered_at = new Date().toISOString();
      const { error } = await client.from('orders').update(updates).eq('id', orderId);
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async function fetchOrdersFromCloud() {
    if (!client) return null;
    try {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('No se pudieron descargar órdenes de Supabase:', err);
      return null;
    }
  }

  // Buscar estado de un vehículo por placa (para el cliente)
  async function searchByPlate(plate) {
    const cleanPlate = (plate || '').toUpperCase().trim();
    if (client) {
      try {
        const { data, error } = await client
          .from('orders')
          .select('*')
          .ilike('plate', `%${cleanPlate}%`)
          .order('created_at', { ascending: false })
          .limit(3);
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Consulta en Supabase falló, buscando en local:', err);
      }
    }
    // Búsqueda en almacenamiento local de respaldo
    const local = (window.appState && window.appState.orders) || [];
    return local.filter(o => o.plate.replace('-', '').toUpperCase().includes(cleanPlate.replace('-', '')));
  }

  // Crear reserva web de cliente
  async function createBooking(booking) {
    if (client) {
      try {
        const { data, error } = await client.from('customer_bookings').insert([booking]);
        if (!error) return { success: true, cloud: true };
      } catch (err) {
        console.warn('Fallo guardando reserva en Supabase, guardando local:', err);
      }
    }
    // Guardar en local storage
    const bookings = JSON.parse(localStorage.getItem('cleanride_bookings') || '[]');
    bookings.push({ ...booking, id: 'bk_' + Date.now(), createdAt: Date.now() });
    localStorage.setItem('cleanride_bookings', JSON.stringify(bookings));
    return { success: true, cloud: false };
  }

  return {
    init,
    getConfig,
    saveConfig,
    testConnection,
    signIn,
    signUp,
    signOut,
    syncOrder,
    updateOrderStatus,
    fetchOrdersFromCloud,
    searchByPlate,
    createBooking,
    isOnline: () => isConnected
  };
})();

// Autoejecutar cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  SupabaseService.init();
});
