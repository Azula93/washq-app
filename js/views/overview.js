/**
 * WashQ / KodiQuett — Vista de Resumen y Métricas
 * Tablero gerencial diario, métricas de tendencia y barra dinámica de ingresos por forma de pago.
 */

    let currentOverviewPeriod = 'hoy';

    function calculateTrendMetrics(period) {
      const now = new Date();
      let currentStart, currentEnd, prevStart, prevEnd, label;

      if (period === 'hoy') {
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        currentEnd = now.getTime();
        prevStart = currentStart - (24 * 3600 * 1000);
        prevEnd = currentStart - 1;
        label = 'vs ayer';
      } else if (period === 'semana') {
        currentStart = now.getTime() - (7 * 24 * 3600 * 1000);
        currentEnd = now.getTime();
        prevStart = currentStart - (7 * 24 * 3600 * 1000);
        prevEnd = currentStart - 1;
        label = 'vs sem. anterior';
      } else {
        currentStart = now.getTime() - (30 * 24 * 3600 * 1000);
        currentEnd = now.getTime();
        prevStart = currentStart - (30 * 24 * 3600 * 1000);
        prevEnd = currentStart - 1;
        label = 'vs mes anterior';
      }

      // Filtrar órdenes que se encuentran en el período actual y anterior
      const currentOrders = appState.orders.filter(o => {
        const time = o.createdAt || 0;
        return time >= currentStart && time <= currentEnd;
      });

      const prevOrders = appState.orders.filter(o => {
        const time = o.createdAt || 0;
        return time >= prevStart && time <= prevEnd;
      });

      const currentRevenue = currentOrders.reduce((sum, o) => sum + (o.price || 0), 0);
      const prevRevenue = prevOrders.reduce((sum, o) => sum + (o.price || 0), 0);
      const currentCommissions = currentOrders.reduce((sum, o) => sum + (o.commission || 0), 0);

      const currentExpenses = appState.expenses
        .filter(e => (e.date || 0) >= currentStart && (e.date || 0) <= currentEnd)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      let percentDiff = 0;
      let status = 'neutral';

      if (prevRevenue > 0) {
        percentDiff = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
        if (percentDiff > 0.05) status = 'positive';
        else if (percentDiff < -0.05) status = 'negative';
        else status = 'neutral';
      } else if (currentRevenue > 0) {
        percentDiff = 100;
        status = 'positive';
      } else {
        percentDiff = 0;
        status = 'neutral';
      }

      return {
        currentRevenue,
        prevRevenue,
        currentCommissions,
        currentExpenses,
        neto: currentRevenue - currentCommissions - currentExpenses,
        percentDiff,
        status,
        label
      };
    }

    function switchPeriod(btn, period) {
      document.querySelectorAll('.time-tab').forEach(t => t.classList.remove('active'));
      if (btn) btn.classList.add('active');
      currentOverviewPeriod = period;
      renderOverview(period);
    }

    // ================= FUNCIONES DE FILTRO DIARIO Y METADATOS DE PAGO =================

    function renderOverview(period = currentOverviewPeriod) {
      const metrics = calculateTrendMetrics(period);

      // Actualizar texto descriptivo superior
      const eyebrowEl = document.getElementById('overviewEyebrow');
      if (eyebrowEl) {
        if (period === 'hoy') eyebrowEl.innerHTML = 'Ingresos totales hoy';
        else if (period === 'semana') eyebrowEl.innerHTML = 'Ingresos totales últimos 7 días';
        else eyebrowEl.innerHTML = 'Ingresos totales últimos 30 días';
      }

      // Actualizar valores numéricos
      document.getElementById('overviewGiantTotal').textContent = formatCOP(metrics.currentRevenue);
      document.getElementById('overviewComisiones').textContent = formatCOP(metrics.currentCommissions);
      document.getElementById('overviewGastos').textContent = formatCOP(metrics.currentExpenses);
      document.getElementById('overviewNeto').textContent = formatCOP(metrics.neto);

      // Píldora de Tendencia Dinámica
      const badgeEl = document.getElementById('overviewTrendBadge');
      const iconEl = document.getElementById('overviewTrendIcon');
      const textEl = document.getElementById('overviewTrendText');

      if (badgeEl && textEl) {
        badgeEl.classList.remove('positive', 'negative', 'neutral');
        badgeEl.classList.add(metrics.status);

        const formatted = Math.abs(metrics.percentDiff).toFixed(1);
        if (metrics.status === 'positive') {
          textEl.textContent = `+${formatted}% ${metrics.label}`;
          if (iconEl) iconEl.innerHTML = '<polyline points="18 15 12 9 6 15"></polyline>';
        } else if (metrics.status === 'negative') {
          textEl.textContent = `-${formatted}% ${metrics.label}`;
          if (iconEl) iconEl.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
        } else {
          textEl.textContent = `0.0% ${metrics.label}`;
          if (iconEl) iconEl.innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line>';
        }
      }

      // Filtrar estrictamente las órdenes correspondientes al día de HOY
      const todayOrders = (appState.orders || []).filter(isOrderToday);

      // Vehículos activos en patio en este momento (espera o lavando)
      const activePatioOrders = (appState.orders || []).filter(o => o.status === 'espera' || o.status === 'lavando');
      const activeCount = activePatioOrders.length;
      document.getElementById('badgeActivePatio').textContent = activeCount;
      document.getElementById('overviewActiveVehiclesCount').textContent = `${activeCount} en Proceso`;
      document.getElementById('sidebarPatioCapacity').innerHTML = `${Math.min(100, activeCount * 20)}% <small>(${activeCount} bahías)</small>`;

      // Mini cola de turnos de hoy
      const miniQueue = document.getElementById('overviewMiniQueueList');
      if (miniQueue) {
        miniQueue.innerHTML = '';
        const queueOrders = activePatioOrders.length > 0 
          ? activePatioOrders.slice(0, 4) 
          : todayOrders.slice(0, 4);

        if (queueOrders.length === 0) {
          miniQueue.innerHTML = `
            <div style="padding: 24px 12px; text-align: center; color: var(--text-muted); font-size: 0.82rem; width: 100%;">
              No hay turnos registrados hoy.<br>
              <span style="font-size: 0.76rem; color: var(--accent-primary); font-weight: 600;">Presiona F2 para nuevo ingreso</span>
            </div>
          `;
        } else {
          queueOrders.forEach(o => {
            const item = document.createElement('div');
            item.className = 'queue-item';
            item.innerHTML = `
              <div style="display:flex; align-items:center;">
                <span class="colombian-plate">${o.plate}</span>
                <div class="vehicle-details">
                  <span class="vehicle-service">${o.serviceName}</span>
                  <span class="vehicle-washer">Operario: ${o.washerName || 'Por Asignar'}</span>
                </div>
              </div>
              <div class="queue-right">
                <span class="queue-price">${formatCOP(o.price)}</span>
                <span class="queue-status-tag ${o.status === 'listo' ? 'tag-ready' : o.status === 'lavando' ? 'tag-washing' : 'tag-waiting'}">
                  ${(o.status || '').toUpperCase()}
                </span>
              </div>
            `;
            miniQueue.appendChild(item);
          });
        }
      }

      // Treemap de Comisiones por Operario (Exclusivamente devengadas HOY)
      const treemap = document.getElementById('overviewTreemapContainer');
      if (treemap) {
        treemap.innerHTML = '';

        const washerStats = (appState.washers || []).filter(w => w.active !== false).map(w => {
          const washerOrdersToday = todayOrders.filter(o => o.washerId === w.id);
          const washerTotalToday = washerOrdersToday.reduce((sum, o) => sum + (o.commission || 0), 0);
          return {
            id: w.id,
            name: w.name || 'Operario',
            count: washerOrdersToday.length,
            total: washerTotalToday
          };
        });

        // Ordenar por comisión de mayor a menor
        washerStats.sort((a, b) => b.total - a.total);
        const totalCommissionsToday = washerStats.reduce((sum, w) => sum + w.total, 0);

        if (totalCommissionsToday === 0) {
          treemap.innerHTML = `
            <div style="padding: 24px 12px; text-align: center; color: var(--text-muted); font-size: 0.82rem; background: var(--bg-surface-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle); width: 100%;">
              Sin comisiones generadas hoy.<br>
              <button onclick="switchView('comisiones')" style="margin-top: 6px; background: none; border: none; color: var(--accent-primary); font-weight: 700; cursor: pointer; text-decoration: underline;">Ver módulo de Comisiones &rarr;</button>
            </div>
          `;
        } else {
          const topWashers = washerStats.slice(0, 3);
          topWashers.forEach((w, idx) => {
            const tile = document.createElement('div');
            const isLead = idx === 0;
            tile.className = `treemap-tile ${isLead ? 'tile-lead' : idx === 1 ? 'tile-second' : 'tile-third'}`;
            tile.onclick = () => switchView('comisiones');
            tile.title = 'Clic para ver detalle de comisiones en Liquidación';
            tile.innerHTML = `
              <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                <span class="treemap-rank-badge" style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800; padding: 2px 7px; border-radius: var(--radius-pill); background: ${isLead ? 'var(--accent-primary)' : 'rgba(116, 116, 132, 0.15)'}; color: ${isLead ? '#fff' : 'inherit'}; flex-shrink: 0;">#${idx + 1}</span>
                <div style="min-width: 0; overflow: hidden;">
                  <div class="treemap-name" style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${w.name}</div>
                  <div class="treemap-count">${w.count} ${w.count === 1 ? 'servicio' : 'servicios'}</div>
                </div>
              </div>
              <div class="treemap-val">${formatCOP(w.total)}</div>
            `;
            treemap.appendChild(tile);
          });
        }
      }

      // ================= CAJA POR FORMA DE PAGO: BARRA DINÁMICA Y DESGLOSE =================
      const meterBar = document.getElementById('overviewPaymentMeterBar');
      const pmList = document.getElementById('overviewPaymentsBreakdownList');
      const paymentsSubtitleEl = document.getElementById('overviewPaymentsSubtitle');

      // Definir rango temporal según período activo (hoy, semana, mes)
      const nowTs = Date.now();
      const todayStartTs = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
      let periodStartTs, periodSubtitleText;

      if (period === 'semana') {
        periodStartTs = nowTs - (7 * 24 * 3600 * 1000);
        periodSubtitleText = 'Cobros registrados esta semana';
      } else if (period === 'mes') {
        periodStartTs = nowTs - (30 * 24 * 3600 * 1000);
        periodSubtitleText = 'Cobros registrados este mes';
      } else {
        periodStartTs = todayStartTs;
        periodSubtitleText = 'Cobros registrados hoy';
      }

      if (paymentsSubtitleEl) paymentsSubtitleEl.textContent = periodSubtitleText;

      // Filtrar órdenes válidas dentro del rango del período
      const targetOrders = (appState.orders || []).filter(o => {
        if (!o || !o.createdAt) return false;
        return o.createdAt >= periodStartTs && o.createdAt <= nowTs;
      });

      // Calcular montos de cada medio de pago
      const pmStats = (appState.paymentMethods || []).map(pm => {
        const meta = getPaymentMethodMeta(pm);
        const pmOrders = targetOrders.filter(o => {
          if (!o.paymentMethod) return false;
          const p = String(o.paymentMethod).toLowerCase();
          return p === pm.id.toLowerCase() || 
                 p === (pm.name || '').toLowerCase() || 
                 p === pm.id.replace('pm_', '').toLowerCase() ||
                 p.includes(meta.key);
        });
        const total = pmOrders.reduce((sum, o) => sum + (o.price || 0), 0);
        return {
          pm,
          meta,
          total,
          ordersCount: pmOrders.length
        };
      });

      const grandTotalPayments = pmStats.reduce((sum, p) => sum + p.total, 0);

      // Renderizar la BARRA DINÁMICA PROPORCIONAL
      if (meterBar) {
        meterBar.innerHTML = '';
        if (grandTotalPayments === 0) {
          meterBar.innerHTML = `<div style="width: 100%; height: 100%; background: var(--border-subtle); opacity: 0.6; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 0.68rem; color: var(--text-muted); font-weight: 600;" title="Sin cobros registrados">Sin cobros registrados</div>`;
        } else {
          pmStats.forEach(stat => {
            if (stat.total > 0) {
              const pct = (stat.total / grandTotalPayments) * 100;
              const seg = document.createElement('div');
              seg.style.cssText = `width: ${pct}%; flex: ${pct} 1 0%; min-width: 4px; height: 100%; background: ${stat.meta.color}; transition: width 0.35s ease;`;
              seg.title = `${stat.pm.name}: ${formatCOP(stat.total)} (${pct.toFixed(1)}%)`;
              meterBar.appendChild(seg);
            }
          });
        }
      }

      // Renderizar la LISTA DE MEDIOS DE PAGO CON ICONO, COLOR Y PORCENTAJE
      if (pmList) {
        pmList.innerHTML = '';
        pmStats.forEach(stat => {
          const pct = grandTotalPayments > 0 
            ? ((stat.total / grandTotalPayments) * 100).toFixed(0) 
            : 0;

          const row = document.createElement('div');
          row.className = 'payment-row';
          row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px dashed var(--border-subtle);';
          row.innerHTML = `
            <div class="payment-row-left" style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${stat.meta.color}; display: inline-block; flex-shrink: 0;"></span>
              <span style="display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; background: ${stat.meta.bg}; flex-shrink: 0;">${stat.meta.iconSvg}</span>
              <span style="font-size: 0.84rem; font-weight: 600; color: var(--text-title);">${stat.pm.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="payment-row-val" style="font-size: 0.86rem; font-weight: 700; font-family: var(--font-mono); color: var(--text-title);">${formatCOP(stat.total)}</span>
              <span style="font-size: 0.72rem; font-weight: 700; color: ${stat.total > 0 ? stat.meta.color : 'var(--text-muted)'}; background: ${stat.total > 0 ? stat.meta.bg : 'var(--bg-surface-subtle)'}; padding: 2px 6px; border-radius: 10px; min-width: 34px; text-align: center;">${pct}%</span>
            </div>
          `;
          pmList.appendChild(row);
        });
      }

      // ================= RENDIMIENTO DE ZONAS DE LAVADO (DINÁMICO POR HORARIO) =================
      renderBayPerformanceCard(targetOrders, activeCount, period);
    }

    function formatHour12(hourFloat) {
      const totalMins = Math.round(hourFloat * 60);
      let h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      const suffix = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
    }

    function formatHourShort(hourFloat) {
      const totalMins = Math.round(hourFloat * 60);
      let h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      const suffix = h >= 12 ? 'p' : 'a';
      h = h % 12;
      if (h === 0) h = 12;
      return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, '0')}`;
    }

    function renderBayPerformanceCard(periodOrders, activeCount, period) {
      const avgNoteEl = document.getElementById('overviewAvgTimeNote');
      const subtitleEl = document.getElementById('overviewBaySubtitle');
      const chartEl = document.getElementById('overviewBayMatrixChart');
      const labelsEl = document.getElementById('overviewBayMatrixLabels');

      const openH = Number(appState.config && typeof appState.config.openHour === 'number' ? appState.config.openHour : 8);
      const rawCloseH = Number(appState.config && typeof appState.config.closeHour === 'number' ? appState.config.closeHour : 17);
      const closeH = rawCloseH > openH ? rawCloseH : openH + 9;

      // Tiempo promedio real con órdenes entregadas
      const deliveredOrders = (periodOrders || []).filter(o => o.status === 'entregado');
      if (avgNoteEl) {
        if (deliveredOrders.length > 0) {
          let totalMin = 0;
          let validCount = 0;
          deliveredOrders.forEach(o => {
            if (o.completedAt && o.createdAt && o.completedAt > o.createdAt) {
              totalMin += Math.max(1, (o.completedAt - o.createdAt) / 60000);
              validCount++;
            } else if (o.estimatedDuration) {
              totalMin += Number(o.estimatedDuration);
              validCount++;
            }
          });
          if (validCount > 0) {
            const avgMin = Math.round(totalMin / validCount);
            avgNoteEl.textContent = `Tiempo promedio: ${avgMin} min (${deliveredOrders.length} ${deliveredOrders.length === 1 ? 'entregado' : 'entregados'})`;
          } else {
            avgNoteEl.textContent = `${deliveredOrders.length} ${deliveredOrders.length === 1 ? 'vehículo entregado' : 'vehículos entregados'}`;
          }
        } else {
          avgNoteEl.textContent = activeCount > 0
            ? 'Sin entregas completadas todavía'
            : 'Sin actividad registrada en este período';
        }
      }

      // Construir columnas según el período seleccionado
      let buckets = [];
      let footerLegend = '';

      if (period === 'semana') {
        if (subtitleEl) subtitleEl.textContent = 'Vehículos ingresados por día (últimos 7 días)';
        footerLegend = 'Barras por día';
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const now = new Date();
        for (let offset = 6; offset >= 0; offset--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
          const startTs = d.getTime();
          const endTs = startTs + (24 * 3600 * 1000) - 1;
          const count = (periodOrders || []).filter(o => o.createdAt >= startTs && o.createdAt <= endTs).length;
          const dateLabel = `${d.getDate()}/${d.getMonth() + 1}`;
          buckets.push({
            label: offset === 0 ? 'Hoy' : dayNames[d.getDay()],
            fullLabel: `${dayNames[d.getDay()]} ${dateLabel}`,
            count,
            isExtra: false
          });
        }
      } else if (period === 'mes') {
        if (subtitleEl) subtitleEl.textContent = 'Vehículos ingresados por semana (últimos 30 días)';
        footerLegend = 'Barras por semana';
        const nowTs = Date.now();
        const weekMs = 7 * 24 * 3600 * 1000;
        for (let w = 3; w >= 0; w--) {
          const endTs = nowTs - (w * weekMs);
          const startTs = endTs - weekMs;
          const count = (periodOrders || []).filter(o => o.createdAt > startTs && o.createdAt <= endTs).length;
          const idx = 4 - w;
          buckets.push({
            label: idx === 4 ? 'Esta sem.' : `Sem ${idx}`,
            fullLabel: idx === 4 ? 'Últimos 7 días' : `Semana ${idx}`,
            count,
            isExtra: false
          });
        }
      } else {
        // Modo HOY: franjas horarias reales según apertura y cierre configurados
        if (subtitleEl) subtitleEl.textContent = `Vehículos por hora hoy (${formatHour12(openH)} a ${formatHour12(closeH)})`;
        footerLegend = 'Barras por franja horaria';

        const numCols = 6;
        const totalSpan = closeH - openH;
        const slotSpan = totalSpan / numCols;

        let beforeCount = 0;
        let afterCount = 0;
        const slotCounts = new Array(numCols).fill(0);

        (periodOrders || []).forEach(o => {
          if (!o || !o.createdAt) return;
          const d = new Date(o.createdAt);
          const orderHour = d.getHours() + d.getMinutes() / 60;
          if (orderHour < openH) {
            beforeCount++;
          } else if (orderHour >= closeH) {
            afterCount++;
          } else {
            let idx = Math.floor((orderHour - openH) / slotSpan);
            if (idx >= numCols) idx = numCols - 1;
            slotCounts[idx]++;
          }
        });

        if (beforeCount > 0) {
          buckets.push({
            label: `<${formatHourShort(openH)}`,
            fullLabel: `Antes de ${formatHour12(openH)} (fuera de horario)`,
            count: beforeCount,
            isExtra: true
          });
        }

        for (let i = 0; i < numCols; i++) {
          const sStart = openH + i * slotSpan;
          const sEnd = openH + (i + 1) * slotSpan;
          buckets.push({
            label: formatHourShort(sStart),
            fullLabel: `${formatHour12(sStart)} - ${formatHour12(sEnd)}`,
            count: slotCounts[i],
            isExtra: false
          });
        }

        if (afterCount > 0) {
          buckets.push({
            label: `+${formatHourShort(closeH)}`,
            fullLabel: `Después de ${formatHour12(closeH)} (fuera de horario)`,
            count: afterCount,
            isExtra: true
          });
        }
      }

      const maxCount = Math.max(0, ...buckets.map(b => b.count));
      const peakIdx = maxCount > 0 ? buckets.findIndex(b => b.count === maxCount) : -1;

      if (chartEl) {
        chartEl.innerHTML = '';
        buckets.forEach((bucket, i) => {
          const filledBlocks = maxCount > 0 && bucket.count > 0
            ? Math.max(1, Math.round((bucket.count / maxCount) * 5))
            : 0;
          const isPeakCol = i === peakIdx && maxCount > 0;

          const col = document.createElement('div');
          col.className = 'matrix-column';
          col.title = `${bucket.fullLabel}: ${bucket.count} ${bucket.count === 1 ? 'vehículo' : 'vehículos'}`;

          const countEl = document.createElement('div');
          countEl.className = 'matrix-col-count' + (isPeakCol ? ' peak' : '');
          countEl.textContent = bucket.count > 0 ? String(bucket.count) : '';
          col.appendChild(countEl);

          const stackEl = document.createElement('div');
          stackEl.className = 'matrix-blocks-stack';
          for (let b = 0; b < 5; b++) {
            const block = document.createElement('div');
            block.className = 'matrix-block';
            if (b < filledBlocks) {
              if (isPeakCol && b === filledBlocks - 1) {
                block.classList.add('peak');
              } else {
                block.classList.add('active');
              }
            }
            stackEl.appendChild(block);
          }
          col.appendChild(stackEl);

          const labelEl = document.createElement('div');
          labelEl.className = 'matrix-col-label' + (isPeakCol ? ' peak' : '') + (bucket.isExtra ? ' extra' : '');
          labelEl.textContent = bucket.label;
          col.appendChild(labelEl);

          chartEl.appendChild(col);
        });
      }

      if (labelsEl) {
        const peakSummary = peakIdx !== -1
          ? `<span style="color: var(--accent-primary); font-weight: 700;">Pico: ${buckets[peakIdx].fullLabel} (${maxCount})</span>`
          : `<span>Sin ingresos registrados</span>`;

        labelsEl.innerHTML = `
          <span>${footerLegend}</span>
          ${peakSummary}
        `;
      }
    }

    // ================= KANBAN CON HERRAMIENTAS ADMIN =================