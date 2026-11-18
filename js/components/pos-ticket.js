/**
 * WashQ / KodiQuett — Generador de Tickets Térmicos POS
 * Visor de ticket de ingreso y entrega, formateado para impresoras de 58mm y 80mm.
 */

    function viewOrderTicket(orderId) {
      const order = appState.orders.find(o => o.id === orderId);
      if (!order) return;

      const dateStr = new Date(order.createdAt).toLocaleString('es-CO');
      const ticketHtml = `
        <div class="ticket-header-biz">${appState.config.businessName}</div>
        <div>${appState.config.address}</div>
        <div>Tel: ${appState.config.phone}</div>
        <div class="ticket-divider"></div>
        <div><strong>TICKET DE TURNO #${order.ticketNumber}</strong></div>
        <div class="ticket-plate-box">${order.plate}</div>
        <div style="text-align: left; margin: 8px 0;">
          <div><strong>Fecha:</strong> ${dateStr}</div>
          <div><strong>Tipo:</strong> ${order.vehicleType.toUpperCase()}</div>
          <div><strong>Servicio:</strong> ${order.serviceName}</div>
          <div><strong>Operario:</strong> ${order.washerName || 'Por asignar'}</div>
          <div><strong>Tiempo Estimado:</strong> ${order.estimatedDuration} min</div>
        </div>
        <div class="ticket-divider"></div>
        <div style="font-size: 1.1rem; font-weight: 800;">TOTAL: ${formatCOP(order.price)}</div>
        <div class="ticket-divider"></div>
        <div style="font-size: 0.7rem;">${appState.config.footerText}</div>
      `;

      document.getElementById('printableTicketArea').innerHTML = ticketHtml;
      openModal('modalTicket');
    }

    // ================= GASTOS & CATEGORÍAS (CONTROL TOTAL) =================