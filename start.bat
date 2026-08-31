@echo off
title Iniciador de Helpdesk Grupo Huerta
echo ====================================================
echo 🔄 INICIANDO SERVICIOS DE HELPDESK...
echo ====================================================

:: 1. Iniciar el Backend
echo 🚀 Iniciando API Backend...
cd /d "C:\Users\AdministradorVw1\Desktop\HelpdeskPortal\backend"
start "Helpdesk API" cmd /k "npm run dev"

:: Esperar 5 segundos para asegurar la conexión de BD
timeout /t 5 /nobreak > nul

:: 2. Iniciar Nginx (Servidor Web Seguro HTTPS)
echo 🚀 Iniciando Servidor Web Nginx...
cd /d "C:\nginx\nginx-1.31.3"
tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [Nginx ya esta corriendo]
) else (
    start nginx
)

echo ====================================================
echo ✅ SERVICIOS INICIADOS CORRECTAMENTE
echo ====================================================