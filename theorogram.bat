@echo off
title Theorogram - Decentralized Truth Platform
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                     THEOROGRAM LAUNCHER                       ║
echo ║          Ideas over people. Reason over reaction.             ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: Check if cloudflared config exists, always recreate to ensure correct config
echo [CONFIG] Setting up Cloudflare tunnel config...

(
echo tunnel: 7045eb29-f9c5-41d6-b6eb-5d6b0ed9552e
echo.
echo credentials-file: C:\Users\AMIT SRIVASTAVA\.cloudflared\7045eb29-f9c5-41d6-b6eb-5d6b0ed9552e.json
echo.
echo protocol: http2
echo.
echo ingress:
echo   # Route API requests to backend ^(port 3001^)
echo   - hostname: cloud.haiclop.xyz
echo     path: /api/*
echo     service: http://localhost:3001
echo.
echo   # Route everything else to frontend ^(port 3000^)
echo   - hostname: cloud.haiclop.xyz
echo     service: http://localhost:3000
echo.
echo   # Catch-all rule ^(required^)
echo   - service: http_status:404
) > "C:\Users\AMIT SRIVASTAVA\.cloudflared\config.yml"

echo [OK] Cloudflare config updated!

echo.
echo [1/3] Starting Backend Server...
echo.
cd /d "%~dp0server"
start "Theorogram Backend" cmd /k "npm run dev"

timeout /t 3 /nobreak > nul

echo [2/3] Starting Frontend Client...
echo.
cd /d "%~dp0client"
start "Theorogram Frontend" cmd /k "npm run dev"

timeout /t 5 /nobreak > nul

echo [3/3] Starting Cloudflare Tunnel...
echo.
echo Tunnel URL: https://cloud.haiclop.xyz
echo.
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel run"

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                    ALL SERVICES STARTED                       ║
echo ╠═══════════════════════════════════════════════════════════════╣
echo ║  Backend:   http://localhost:3001                             ║
echo ║  Frontend:  http://localhost:3000                             ║
echo ║  Public:    https://cloud.haiclop.xyz                         ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Press any key to exit this launcher (services will keep running)...
pause > nul
