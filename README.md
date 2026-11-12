# 🚗 WashQ — Sistema de Control Operativo para Autolavados (PWA Soberana)

Software operativo para autolavados, servitecas y centros de detailing en Colombia. Diseñado para funcionar de forma **100% autónoma y offline (Local-First)**: sin depender de servidores en la nube, sin bases de datos externas que administrar, sin mensualidades forzosas y con posesión total en manos del cliente final.

---

## 🌟 Características de la PWA (Progressive Web App)

1. **Instalable en cualquier dispositivo:**
   - **PC / Windows:** Se instala como aplicación de escritorio nativa sin barra de direcciones.
   - **Android:** Instalación con 1 toque desde Chrome. Icono nativo en la pantalla de inicio.
   - **iOS / iPhone / iPad:** "Añadir a pantalla de inicio" desde Safari a pantalla completa.
2. **Funcionamiento 100% Offline Soberano:**
   - La base de datos y la lógica viven en el dispositivo local (`localStorage` / `IndexedDB`).
   - El Service Worker (`sw.js`) precarga toda la interfaz para abrir al instante sin conexión.
3. **Corte y Arqueo al Dueño por WhatsApp (Sin Base de Datos Central):**
   - El botón **"📲 Enviar Arqueo al Dueño"** genera un mensaje estructurado con el recaudo por canales (Efectivo, Nequi, Daviplata, Bancolombia), comisiones acumuladas por cada lavador, gastos del turno y el **efectivo físico exacto que debe haber en el cajón**.
4. **Impresión Térmica POS Calibrada (58mm / 80mm):**
   - Compatible con impresoras térmicas USB y Bluetooth.
   - Formato compacto con placa, servicio, hora de entrega y datos fiscales del negocio.
5. **Respaldo y Restauración Soberana:**
   - Exportación de la base de datos en 1 clic a archivo `.json`.
   - Restauración en cualquier equipo nuevo sin asistencia técnica.
   - Exportación de reportes a Excel (`.csv`).

---

## 🚀 Modos de Uso y Despliegue

### Modo 1: En la Nube (Vercel / Dominio Kodiquett)
- Sube esta carpeta directamente a Vercel con el archivo `vercel.json` incluido.
- Vincula tu subdominio (ej: `wash.kodiquett.com`).
- Cualquier cliente o usuario que visite la URL podrá pulsar **"Instalar App"** para tenerla instalada en su equipo.

### Modo 2: Local en PC y Red Wi-Fi del Patio
1. Haz doble clic en **`iniciar_pc.bat`**.
2. Se abrirá automáticamente en tu navegador en `http://localhost:3000`.
3. Para conectar los celulares de los lavadores en el patio: conéctalos a la misma red Wi-Fi y abre la dirección IP que muestra la consola (ej. `http://192.168.1.15:3000`).

---

## 💼 Protocolo de Entrega "Combo Llave en Mano" ($590.000 COP)

1. **Hardware:** Impresora térmica portátil de 58mm (Bluetooth/USB) + 5 rollos de papel térmico.
2. **Software:** Instalación de la PWA en el PC o celular de caja del autolavado.
3. **Configuración inicial:**
   - Nombre, dirección y teléfono del autolavado.
   - Número de WhatsApp privado del dueño para recibir cortes.
   - Catálogo de tarifas por tipo de vehículo (Motos, Carros, Camionetas, Taxis).
   - Lista de lavadores y porcentajes de liquidación.
4. **Copia de Seguridad:** Dejar un archivo de respaldo guardado en el equipo y en una memoria USB entregada con la impresora.
