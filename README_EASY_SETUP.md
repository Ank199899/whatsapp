# 🚀 WhatsApp Marketing Application - Easy Setup

A comprehensive WhatsApp marketing and automation platform with **super easy server deployment**.

## ⚡ Quick Setup (Choose Your Method)

### 🐳 Docker Setup (Easiest - Recommended)
```bash
# One command setup
git clone https://github.com/Ank199899/whatsapp.git
cd whatsapp
docker-compose up -d
```
**Access at:** `http://your-server-ip`

### 📦 Ubuntu Server Setup (One Command)
```bash
# Complete server installation
curl -sSL https://raw.githubusercontent.com/Ank199899/whatsapp/master/install.sh | bash
```

### ☁️ Remote Server Deployment
```bash
# From your local machine
SERVER_IP=your.server.ip SERVER_USER=your_username npm run server:deploy
```

### 🔧 Universal Setup Script
```bash
# Interactive setup with multiple options
chmod +x setup.sh && ./setup.sh
```

## 📚 Setup Guides

- **[Easy Server Setup](EASY_SERVER_SETUP.md)** - Complete Ubuntu server setup guide
- **[Docker Setup](DOCKER_SETUP.md)** - Docker and Docker Compose setup
- **[Installation Guide](INSTALLATION_GUIDE.md)** - Detailed installation instructions

## ✨ Features

- **WhatsApp Integration**: Connect multiple WhatsApp numbers using whatsapp-web.js
- **Real-time Messaging**: Send and receive messages with real-time updates
- **Contact Management**: Organize and manage your contacts efficiently
- **Campaign Management**: Create and manage marketing campaigns
- **AI Agent Integration**: Advanced AI-powered chat automation
- **Media Support**: Send images, videos, documents, and other media files
- **Analytics Dashboard**: Track message delivery, engagement, and campaign performance
- **Multi-user Support**: Team collaboration with role-based access
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **WhatsApp**: whatsapp-web.js
- **Real-time**: Socket.IO
- **Authentication**: Passport.js with Google OAuth
- **File Storage**: Local storage with Multer
- **Process Management**: PM2

## 📊 Management Commands

### Native Installation
```bash
# Application control
/opt/whatsapp-marketing/start.sh
/opt/whatsapp-marketing/stop.sh
/opt/whatsapp-marketing/restart.sh
/opt/whatsapp-marketing/status.sh

# PM2 commands
sudo -u whatsapp-user pm2 status
sudo -u whatsapp-user pm2 logs whatsapp-marketing
sudo -u whatsapp-user pm2 restart whatsapp-marketing
```

### Docker Installation
```bash
# Container management
docker-compose up -d
docker-compose down
docker-compose restart
docker-compose logs -f whatsapp-app

# Individual containers
docker logs whatsapp-marketing -f
docker restart whatsapp-marketing
```

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/whatsapp_marketing

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Session
SESSION_SECRET=your-super-secret-session-key

# WhatsApp
WHATSAPP_SESSION_PATH=./whatsapp-web-sessions
WHATSAPP_MAX_SESSIONS=10

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Security
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Development/Production flags
DISABLE_AUTH=true
AUTO_ADMIN=true
```

## 🔒 Security Features

### Built-in Security
- **Firewall Configuration**: UFW with restricted ports
- **Rate Limiting**: API protection against abuse
- **CORS Protection**: Configurable CORS policies
- **Input Validation**: Comprehensive validation and sanitization
- **Session Security**: Secure session management
- **File Upload Security**: Safe file upload restrictions

### Network Security
- SSH (22): Open
- HTTP (80): Open
- HTTPS (443): Open
- PostgreSQL (5432): Localhost only
- All other ports: Blocked

## 📈 Performance Optimization

### For High Load
```bash
# Scale PM2 instances
sudo -u whatsapp-user pm2 scale whatsapp-marketing 2

# Docker scaling
docker-compose up -d --scale whatsapp-app=3

# Monitor resources
htop
sudo -u whatsapp-user pm2 monit
```

### Database Optimization
```sql
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_user_id ON whatsapp_numbers(user_id);
```

## 🛠️ Troubleshooting

### Common Issues

**Application Won't Start**
```bash
# Check PM2 status
sudo -u whatsapp-user pm2 status

# View error logs
sudo -u whatsapp-user pm2 logs whatsapp-marketing --err

# Docker logs
docker-compose logs whatsapp-app
```

**Database Connection Issues**
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U whatsapp_user -d whatsapp_marketing -h localhost -c "SELECT version();"

# Docker database
docker exec -it whatsapp-postgres psql -U whatsapp_user -d whatsapp_marketing
```

**WhatsApp Connection Problems**
```bash
# Clear sessions
sudo rm -rf /var/whatsapp-sessions/*
sudo -u whatsapp-user pm2 restart whatsapp-marketing

# Docker sessions
docker-compose restart whatsapp-app
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Native installation
cd /opt/whatsapp-marketing
git pull origin master
sudo -u whatsapp-user npm install
sudo -u whatsapp-user npm run build
sudo -u whatsapp-user pm2 restart whatsapp-marketing

# Docker installation
git pull origin master
docker-compose build --no-cache
docker-compose up -d
```

### Backup
```bash
# Database backup
sudo -u postgres pg_dump whatsapp_marketing > backup_$(date +%Y%m%d).sql

# Docker backup
docker exec whatsapp-postgres pg_dump -U whatsapp_user whatsapp_marketing > backup.sql
```

## 📞 Support

### Log Locations
- **Native**: `/var/log/whatsapp-app/`
- **Docker**: `docker-compose logs -f`
- **PM2**: `sudo -u whatsapp-user pm2 logs`

### Quick Verification
1. **Application running**: Check PM2/Docker status
2. **Web access**: Open `http://your-server-ip`
3. **Database**: Test connection
4. **WhatsApp**: Generate QR code
5. **File uploads**: Test media upload

## 🎯 One-Line Deployment Summary

```bash
# Complete setup in one command
curl -sSL https://raw.githubusercontent.com/Ank199899/whatsapp/master/install.sh | bash
```

## 📋 Server Requirements

- **OS**: Ubuntu 18.04+ (tested on 20.04, 22.04)
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 10GB free space
- **Network**: Internet connection for dependencies

## 🎉 What You Get

After setup, you'll have:
- ✅ WhatsApp Marketing Application running
- ✅ PostgreSQL database configured
- ✅ Nginx reverse proxy setup
- ✅ PM2 process management
- ✅ Firewall configured
- ✅ SSL-ready configuration
- ✅ Automatic backups
- ✅ Log management
- ✅ Health monitoring

---

**🚀 Built for easy deployment and maximum performance**

**Access your application at: `http://your-server-ip`**
