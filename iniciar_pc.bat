@echo off
title WashQ - Sistema de Control Operativo
cls
echo ============================================================
echo           INICIANDO SISTEMA DE AUTOLAVADO WASHQ
echo       (100% Offline Soberano - Sin Hosting ni Servidores)
echo ============================================================
echo.
echo Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Node.js no esta instalado.
    echo Abriendo WashQ directamente en tu navegador predeterminado...
    start "" "%~dp0index.html"
    pause
    exit /b
)

echo Iniciando servidor local en red Wi-Fi para patio y celulares...
node "%~dp0servidor_local.js"
pause
