@echo off
echo Setting up PM2 for WhatsApp Server...
echo.

cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Stopping any existing PM2 processes...
pm2 stop whatsapp-server 2>nul
pm2 delete whatsapp-server 2>nul

echo Starting WhatsApp server with PM2...
pm2 start working-server.js --name "whatsapp-server"

echo.
echo Checking PM2 status...
pm2 status

echo.
echo Setting up PM2 to auto-start on system reboot...
pm2 startup
pm2 save

echo.
echo ✅ WhatsApp server is now running with PM2!
echo 🌐 Your server is available at: http://localhost:5000
echo 📱 WhatsApp interface: http://localhost:5000/inbox
echo.
echo PM2 Commands:
echo   pm2 status          - Check server status
echo   pm2 logs            - View server logs
echo   pm2 restart whatsapp-server - Restart server
echo   pm2 stop whatsapp-server    - Stop server
echo.
pause
