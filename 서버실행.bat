@echo off
title BBD AdMall Server
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org
  pause
  exit /b 1
)

echo ==========================================
echo   Starting server...
echo   Shop : http://localhost:3000
echo   Admin: http://localhost:3000/admin/
echo   Close this window or press Ctrl+C to stop.
echo ==========================================
echo.

start "" "http://localhost:3000"
node server.js

echo.
echo Server stopped.
pause
