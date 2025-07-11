@echo off
echo Starting WhatsApp Bulk AI Server...
echo.

cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Checking Node.js version...
node --version
echo.

echo Starting server...
npm run dev

pause
