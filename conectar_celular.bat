@echo off
title WashQ - Conectar Celular (Tunel HTTPS Seguro)
cls
echo ============================================================
echo          GENERANDO ENLACE HTTPS PARA TU CELULAR
echo ============================================================
echo.
echo [1] Asegurate de que "iniciar_pc.bat" siga abierto corriendo.
echo [2] Conectando tunel seguro...
echo.
echo ============================================================
echo   EN LA PANTALLA APARECERA UN ENLACE QUE DICE "https://..."
echo   ESCRIBE ESE ENLACE "https://..." EN TU CELULAR
echo ============================================================
echo.
ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:3050 a.pinggy.io
if %errorlevel% neq 0 (
    echo.
    echo Intentando por puerto 80...
    ssh -o StrictHostKeyChecking=no -R0:localhost:3050 a.pinggy.io
)
pause
