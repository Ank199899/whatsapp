# 🚀 WhatsApp Marketing - Easy Deployment Guide

This guide provides the simplest way to deploy the WhatsApp Marketing application on any server or local machine.

## 📋 Prerequisites

- **Node.js 16+** (will be installed automatically if missing)
- **Git** (to clone the repository)
- **SSH access** (for remote deployment)

## 🖥️ Local Deployment (Windows/Linux/Mac)

### Option 1: One-Click Deployment (Linux/Mac)
```bash
# Clone the repository
git clone https://github.com/Ank199899/whatsapp.git
cd whatsapp

# Make script executable and run
chmod +x easy-deploy.sh
./easy-deploy.sh
```

### Option 2: Windows Deployment
```cmd
# Clone the repository
git clone https://github.com/Ank199899/whatsapp.git
cd whatsapp

# Run the Windows deployment script
easy-deploy.bat
```

### Option 3: Manual Deployment
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
```

## 🌐 Remote Server Deployment

### Ubuntu/Debian Server
```bash
# From your local machine, deploy to remote server
./easy-deploy.sh 192.168.1.230 admin1 3000

# Or with custom settings
./easy-deploy.sh <server_ip> <username> <port>
```

### Manual Remote Deployment
```bash
# 1. Copy files to server
rsync -avz --exclude='node_modules' ./ user@server:/opt/whatsapp-marketing/

# 2. SSH to server and setup
ssh user@server
cd /opt/whatsapp-marketing

# 3. Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2 and dependencies
sudo npm install -g pm2
npm install

# 5. Build and start
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 🐳 Docker Deployment

### Quick Docker Setup
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t whatsapp-marketing .
docker run -d -p 3000:3000 --name whatsapp-app whatsapp-marketing
```

## ⚙️ Configuration

### Environment Variables (.env)
The application will automatically create a `.env` file with default settings:

```env
# Database Configuration
DATABASE_URL=file:./whatsapp.db

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Session Configuration
SESSION_SECRET=whatsapp-marketing-super-secret-key-change-this-in-production

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./whatsapp-web-sessions
WHATSAPP_MAX_SESSIONS=10

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Security Configuration
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Development/Production flags
DISABLE_AUTH=true
AUTO_ADMIN=true
```

### Custom Port
```bash
# Linux/Mac
./easy-deploy.sh 192.168.1.230 admin1 8080

# Windows
easy-deploy.bat 8080
```

## 📊 Monitoring & Management

### PM2 Commands
```bash
# Check application status
pm2 status

# View logs
pm2 logs whatsapp-marketing

# Restart application
pm2 restart whatsapp-marketing

# Stop application
pm2 stop whatsapp-marketing

# Real-time monitoring
pm2 monit
```

### Application URLs
- **Main Application**: `http://your-server:3000`
- **WhatsApp Interface**: `http://your-server:3000/inbox`
- **API Endpoints**: `http://your-server:3000/api/*`

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in .env file
   PORT=8080
   pm2 restart whatsapp-marketing
   ```

2. **Permission denied**
   ```bash
   # Fix file permissions
   chmod +x easy-deploy.sh
   sudo chown -R $USER:$USER /opt/whatsapp-marketing
   ```

3. **Node.js version issues**
   ```bash
   # Install specific Node.js version
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **PM2 not found**
   ```bash
   # Install PM2 globally
   sudo npm install -g pm2
   ```

### Logs Location
- **Application logs**: `./logs/`
- **PM2 logs**: `~/.pm2/logs/`
- **System logs**: `/var/log/` (Linux)

## 🔄 Updates

### Update Application
```bash
# Pull latest changes
git pull origin master

# Rebuild and restart
npm run build
pm2 restart whatsapp-marketing
```

### Backup Data
```bash
# Backup database and sessions
tar -czf backup-$(date +%Y%m%d).tar.gz whatsapp.db whatsapp-web-sessions/ uploads/
```

## 🆘 Support

If you encounter any issues:

1. Check the logs: `pm2 logs whatsapp-marketing`
2. Verify the configuration: `cat .env`
3. Check system resources: `pm2 monit`
4. Restart the application: `pm2 restart whatsapp-marketing`

## 📝 Notes

- The application runs without authentication by default (`DISABLE_AUTH=true`)
- All WhatsApp features are preserved and unchanged
- The UI design remains exactly the same
- Database is SQLite by default (file-based, no external database required)
- Sessions and uploads are stored locally
- The application automatically creates necessary directories

## 🎯 Quick Start Summary

**For Local Setup:**
```bash
git clone https://github.com/Ank199899/whatsapp.git
cd whatsapp
./easy-deploy.sh  # Linux/Mac
# OR
easy-deploy.bat   # Windows
```

**For Remote Server:**
```bash
./easy-deploy.sh 192.168.1.230 admin1 3000
```

**Access Application:**
- Open browser: `http://localhost:3000` or `http://your-server:3000`
- Go to WhatsApp: `http://localhost:3000/inbox`

That's it! Your WhatsApp Marketing application is ready to use! 🎉
