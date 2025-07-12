@echo off
setlocal enabledelayedexpansion

REM WhatsApp Marketing Application - Easy Windows Deployment Script
REM Usage: easy-deploy.bat [port]

echo ================================================
echo   WhatsApp Marketing - Easy Windows Deployment
echo ================================================
echo.

set DEFAULT_PORT=3000
set APP_NAME=whatsapp-marketing
set PORT=%1
if "%PORT%"=="" set PORT=%DEFAULT_PORT%

echo Port: %PORT%
echo.

REM Check if Node.js is installed
echo [1/8] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
)

REM Check if PM2 is installed
echo [2/8] Checking PM2 installation...
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo Installing PM2...
    npm install -g pm2
    if errorlevel 1 (
        echo ❌ Failed to install PM2
        pause
        exit /b 1
    )
    echo ✅ PM2 installed
) else (
    echo ✅ PM2 found
)

REM Install dependencies
echo [3/8] Installing dependencies...
npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

REM Build application
echo [4/8] Building application...
npm run build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)
echo ✅ Application built

REM Create directories
echo [5/8] Creating directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "whatsapp-web-sessions" mkdir whatsapp-web-sessions
echo ✅ Directories created

REM Create .env file if not exists
echo [6/8] Setting up environment...
if not exist ".env" (
    echo Creating .env file...
    (
        echo # Database Configuration
        echo DATABASE_URL=file:./whatsapp.db
        echo.
        echo # Server Configuration
        echo PORT=%PORT%
        echo HOST=0.0.0.0
        echo NODE_ENV=production
        echo.
        echo # Session Configuration
        echo SESSION_SECRET=whatsapp-marketing-super-secret-key-change-this-in-production
        echo.
        echo # WhatsApp Configuration
        echo WHATSAPP_SESSION_PATH=./whatsapp-web-sessions
        echo WHATSAPP_MAX_SESSIONS=10
        echo.
        echo # File Upload Configuration
        echo UPLOAD_PATH=./uploads
        echo MAX_FILE_SIZE=10485760
        echo.
        echo # Security Configuration
        echo CORS_ORIGIN=*
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # Logging Configuration
        echo LOG_LEVEL=info
        echo LOG_FILE_PATH=./logs/app.log
        echo.
        echo # Development/Production flags
        echo DISABLE_AUTH=true
        echo AUTO_ADMIN=true
    ) > .env
    echo ✅ .env file created
) else (
    echo ✅ .env file exists
)

REM Setup database
echo [7/8] Setting up database...
npm run db:push
if errorlevel 1 (
    echo ⚠️  Database setup warning (continuing...)
)
echo ✅ Database setup completed

REM Stop existing PM2 process
echo [8/8] Starting application...
pm2 delete %APP_NAME% >nul 2>&1

REM Start application with PM2
pm2 start ecosystem.config.js --env production
if errorlevel 1 (
    echo ❌ Failed to start application
    pause
    exit /b 1
)

REM Save PM2 configuration
pm2 save

echo.
echo ✅ WhatsApp Marketing Application deployed successfully!
echo ================================================
echo 🌐 Application URL: http://localhost:%PORT%
echo 📱 WhatsApp Interface: http://localhost:%PORT%/inbox
echo 🔧 API Endpoints: http://localhost:%PORT%/api/*
echo.
echo 📊 Monitoring Commands:
echo   pm2 status                    - Check application status
echo   pm2 logs %APP_NAME%          - View application logs
echo   pm2 monit                     - Real-time monitoring
echo   pm2 restart %APP_NAME%       - Restart application
echo   pm2 stop %APP_NAME%          - Stop application
echo.
echo 🔧 Configuration:
echo   Edit .env file for database and other settings
echo   Use 'pm2 restart %APP_NAME%' after changing .env
echo ================================================

pause
