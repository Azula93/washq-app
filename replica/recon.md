# REA & REPLICA: Recon Map - Sistema de Gestión de Lavadero de Carros y Motos

> **Documento:** `replica/recon.md`  
> **Objetivo:** Ingeniería inversa funcional y arquitectura de software para autolavados y centros de estética vehicular en Colombia (Cali - COP).  
> **Modo de Operación:** 100% Autónomo / Local-First (funciona en móvil y PC sin servidores, sin dominios, sin internet).

---

## 1. Alcance y Referentes Analizados

| Fuente Analizada | Tipo | Propuesta de Valor Extraída |
| :--- | :--- | :--- |
| **BycoApp** (`bycoapp.com.co`) | Web App / SaaS Colombia | Control de órdenes por placa, liquidación de comisiones a lavadores, arqueo de caja y alertas WhatsApp. |
| **Hangar.la** (`hangar.la`) | Plataforma Integral Colombia | Checklist de estado de ingreso, estados visuales de patio, roles de personal y validación QR. |
| **Car Wash Demo 1** (`jHY5hWfUL-g`) | Web App Demo | Tablero de flujo de trabajo, control de tiempos y estadísticas de servicios diarios. |
| **Web App Car Wash** (`uOU1rjYD3jU`) | Demo de Control Operativo | Registro rápido de gastos diarios, administración de lavadores y flujo simplificado de cobro. |

---

## 2. Inventario de Pantallas (Screen Inventory)

| ID | Pantalla | Propósito | Componentes Clave |
| :--- | :--- | :--- | :--- |
| **S01** | **Patio en Vivo (Tablero Kanban / Cola)** | Monitorear todos los vehículos en el lavadero en tiempo real. | Tarjetas de estado (*En Espera*, *Lavando*, *Listo*, *Entregado*), cronómetro de tiempo transcurrido, semáforo de tiempo excedido, botón rápido de cambio de estado. |
| **S02** | **Ingreso Rápido Express (Nuevo Vehículo)** | Registrar una moto o carro en menos de 10 segundos. | Input de Placa con auto-mayúsculas y formato colombiano, selector visual de tipo de vehículo (Moto/Carro/SUV/Taxi), selector de servicio con precio y tiempo estimado, asignación de lavador, botón de guardar e imprimir ticket. |
| **S03** | **Caja y Arqueo Diario** | Controlar entradas, salidas y dinero neto en caja. | Balance del día (Ingresos por servicio, Gastos, Pago de comisiones), botón de "Nuevo Gasto", resumen por método de pago (Efectivo, Nequi, Daviplata, Transferencia). |
| **S04** | **Historial y Reportes de Servicios** | Auditoría y búsqueda de vehículos atendidos. | Buscador por placa o fecha, tabla de servicios completados, detalle de cobro, exportación a Excel/CSV. |
| **S05** | **Configuración de Servicios y Precios** | Adaptar las tarifas al modelo de negocio de Cali. | Listado de servicios (Sencillo, Full, Motor, Polichado, etc.), editor de precios en COP, duración estimada en minutos, porcentaje o valor de comisión por empleado. |
| **S06** | **Gestión de Personal / Lavadores** | Administrar los lavadores y consultar sus pagos. | Lista de lavadores, total de vehículos lavados hoy, monto de comisión acumulada a pagar. |
| **S07** | **Visor / Impresión de Ticket Térmico** | Generar recibo de entrada y comprobante de salida. | Formato estándar POS 58mm / 80mm, datos del lavadero, placa, hora de entrada, hora estimada de entrega, valor y código de barra/QR de salida. |

---

## 3. Flujos de Usuario (User Flows)

### F01: Recepción de Vehículo en Patio (Happy Path < 10 segundos)
```
S01 (Dashboard) -> Tocar botón grande "Nuevo Ingreso"
-> S02: Escribir placa (ej: WXQ-45E o ABC-123)
-> Tocar Tipo de Vehículo: [Moto] o [Carro]
-> Tocar Servicio: [Lavado Sencillo - $15.000 (25 min)]
-> Tocar Lavador: [Carlos M.]
-> Tocar "Registrar e Imprimir Ticket"
-> S07: Se abre vista de impresión de ticket térmico 58mm / Se añade a la columna "En Espera" en S01.
```

### F02: Avance de Estado y Alerta de Retiro
```
S01: Operador ve tarjeta de carro ABC-123 -> Toca botón "Pasar a Lavado" (inicia cronómetro)
-> Cuando termina, toca "Marcar como Listo"
-> Se despliega botón de "Avisar por WhatsApp": Abre mensaje predeterminado con el número del cliente sin costo de API
-> Cliente paga -> Se registra método de pago (Efectivo o Nequi) -> Pasa a estado "Entregado".
```

### F03: Registro de Gasto Rápido y Cierre de Caja
```
S03: Caja -> Tocar "Registrar Gasto" -> Motivo: "Compra de cera y silicona" -> Monto: $25.000 COP -> Guardar.
-> Al final de la jornada: Ver "Resumen del Día":
   Ingresos Totales - Gastos - Comisiones de Lavadores = Efectivo Neto en Caja.
```

---

## 4. Modelo de Datos Inferido (Local-First / SQLite / IndexedDB)

### Entidad: `VehiculoServicio` (Orden de Trabajo)
- `id`: UUID / Entero autoincremental
- `placa`: Texto (ej: "CWL-902", "JKE-44D")
- `tipo_vehiculo`: Enum (`moto`, `carro`, `suv_camioneta`, `taxi`, `pesado`)
- `servicio_id`: Relación a `CatalogoServicio`
- `precio_cobrado`: Entero COP (ej: 28000)
- `metodo_pago`: Enum (`efectivo`, `nequi`, `daviplata`, `transferencia`, `pendiente`)
- `lavador_id`: Relación a `Lavador`
- `comision_calculada`: Entero COP
- `hora_ingreso`: Timestamp
- `hora_estimada_entrega`: Timestamp
- `hora_finalizacion`: Timestamp (opcional)
- `estado`: Enum (`espera`, `lavando`, `listo`, `entregado`, `cancelado`)
- `telefono_cliente`: Texto (opcional, para WhatsApp)
- `observaciones`: Texto (ej: "Rayón puerta derecha", "Dejó casco")

### Entidad: `CatalogoServicio`
- `id`: UUID
- `nombre`: Texto (ej: "Lavado Sencillo", "Lavado Full", "Combo Motor + Chasis")
- `tipo_vehiculo`: Enum (`moto`, `carro`, `suv_camioneta`, `taxi`)
- `precio_cop`: Entero COP
- `duracion_minutos`: Entero (ej: 25, 45, 60)
- `tipo_comision`: Enum (`porcentaje`, `fijo`)
- `valor_comision`: Número (ej: 40% o 6000 COP)
- `activo`: Booleano

### Entidad: `Lavador` (Empleado de Patio)
- `id`: UUID
- `nombre`: Texto
- `telefono`: Texto
- `activo`: Booleano

### Entidad: `GastoCaja`
- `id`: UUID
- `fecha_hora`: Timestamp
- `categoria`: Texto (ej: "Insumos", "Refrigerio", "Mantenimiento", "Servicios")
- `descripcion`: Texto
- `monto_cop`: Entero COP
- `registrado_por`: Texto

---

## 5. Estrategia de Cero Hosting y Compatibilidad Móvil/PC
1. **PWA Standalone (Progressive Web App):**
   - El sistema se instala directamente desde el navegador en cualquier teléfono Android o iPhone tocando *"Añadir a la pantalla de inicio"* o *"Instalar App"*.
   - Funciona sin internet mediante Service Worker y almacenamiento local persistente (IndexedDB).
   - En PC funciona como aplicación de escritorio nativa mediante atajo de aplicación o ejecutable local.
2. **Soporte de Impresión POS Térmica:**
   - Hoja de estilos `@media print` calibrada exactamente para rollos térmicos de 58mm y 80mm.
   - Compatible con impresoras térmicas USB en PC e impresoras Bluetooth en Android.
3. **Respaldo de Datos Seguro:**
   - Botón de "Exportar Copia de Seguridad" (descarga archivo `.json` o `.csv` en un clic).
   - Botón de "Restaurar Copia" para migrar datos entre dispositivos sin internet ni servidores.
