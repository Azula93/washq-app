/**
 * Servidor Local Ultraliviano para LavaFácil Cali
 * Cero Dependencias (Usa solo los módulos nativos de Node.js)
 * Permite usar el sistema en el PC y conectarse desde cualquier celular en el patio vía Wi-Fi.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const PORT = 3050;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    if (/virtual|vethernet|vmware|vbox|host-only/i.test(name)) continue;
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!iface.address.startsWith('192.168.56.')) {
          return iface.address;
        }
      }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(BASE_DIR, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Archivo no encontrado');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Error interno del servidor local');
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('\n============================================================');
  console.log('            🚗 WASHQ - CONTROL DE AUTOLAVADO 🚗             ');
  console.log('        (100% Offline Soberano • Sin Servidores ni Hosting)   ');
  console.log('============================================================');
  console.log(`\n💻 1. PARA USAR EN ESTE COMPUTADOR:`);
  console.log(`   -> Abre en tu navegador: http://localhost:${PORT}`);
  console.log(`\n📱 2. PARA USAR EN TU CELULAR EN EL PATIO:`);
  console.log(`   -> Conecta el celular al mismo Wi-Fi del negocio y abre:`);
  console.log(`   -> http://${localIP}:${PORT}`);
  console.log(`   -> (En Chrome/Safari del celular, toca "Instalar aplicación"`);
  console.log(`      o "Añadir a la pantalla de inicio" para tenerla como App)\n`);
  console.log('Presiona Ctrl + C en esta ventana para detener el servidor.\n');

  // Abrir automáticamente el navegador en PC
  const openCmd = process.platform === 'win32' ? `start http://localhost:${PORT}` : `xdg-open http://localhost:${PORT}`;
  exec(openCmd);
});
