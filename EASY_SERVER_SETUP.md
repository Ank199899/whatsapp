# 🚀 WhatsApp Marketing Application - Easy Server Setup

## 📋 Quick Setup (3 Commands Only!)

### Prerequisites
- Ubuntu 18.04+ server
- SSH access to your server
- Server user with sudo privileges

### Option 1: Complete Automated Setup (Recommended)

**Step 1: Install server dependencies**
```bash
# On your Ubuntu server, run:
curl -sSL https://raw.githubusercontent.com/Ank199899/whatsapp/master/scripts/install-server.sh | bash
```

**Step 2: Deploy application from your local machine**
```bash
# On your local machine (in the app directory), run:
SERVER_IP=your.server.ip SERVER_USER=your_username npm run server:deploy
```

**Step 3: Access your application**
```
Open browser: http://your.server.ip
```

### Option 2: Manual Setup

**Step 1: Prepare server**
```bash
# On your server:
wget https://raw.githubusercontent.com/Ank199899/whatsapp/master/scripts/install-server.sh
chmod +x install-server.sh
./install-server.sh
```

**Step 2: Upload files and setup**
```bash
# Upload your app files to /opt/whatsapp-marketing on server
# Then on server:
cd /opt/whatsapp-marketing
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh
```

## 🔧 Configuration

### Default Settings
- **Application Port**: 3000
- **Database**: PostgreSQL (whatsapp_marketing)
- **Web Server**: Nginx (reverse proxy)
- **Process Manager**: PM2
- **User**: whatsapp-user

### Environment Variables
The setup automatically creates `.env` file with:
- Database connection
- WhatsApp session storage
- File upload settings
- Security configurations

### Server Requirements
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 10GB free space
- **Network**: Internet connection for dependencies
- **OS**: Ubuntu 18.04+ (tested on 20.04, 22.04)

## 📊 Management Commands

### Application Control
```bash
# Start application
/opt/whatsapp-marketing/start.sh

# Stop application
/opt/whatsapp-marketing/stop.sh

# Restart application
/opt/whatsapp-marketing/restart.sh

# Check status
/opt/whatsapp-marketing/status.sh
```

### PM2 Commands
```bash
# View all processes
sudo -u whatsapp-user pm2 status

# View logs
sudo -u whatsapp-user pm2 logs whatsapp-marketing

# Monitor resources
sudo -u whatsapp-user pm2 monit

# Restart application
sudo -u whatsapp-user pm2 restart whatsapp-marketing
```

### System Services
```bash
# Check Nginx
sudo systemctl status nginx
sudo systemctl restart nginx

# Check PostgreSQL
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Check firewall
sudo ufw status
```

## 🔒 Security Features

### Firewall Configuration
- SSH (22): Open
- HTTP (80): Open
- HTTPS (443): Open
- PostgreSQL (5432): Localhost only
- All other ports: Blocked

### Application Security
- CORS protection
- Rate limiting
- Secure headers
- Session management
- File upload restrictions

## 🛠️ Troubleshooting

### Application Won't Start
```bash
# Check PM2 status
sudo -u whatsapp-user pm2 status

# View error logs
sudo -u whatsapp-user pm2 logs whatsapp-marketing --err

# Restart application
sudo -u whatsapp-user pm2 restart whatsapp-marketing
```

### Database Issues
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U whatsapp_user -d whatsapp_marketing -h localhost -c "SELECT version();"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Nginx Issues
```bash
# Check status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### WhatsApp Connection Problems
```bash
# Clear sessions
sudo rm -rf /var/whatsapp-sessions/*
sudo -u whatsapp-user pm2 restart whatsapp-marketing
```

## 📈 Performance Optimization

### For High Load
```bash
# Scale PM2 instances
sudo -u whatsapp-user pm2 scale whatsapp-marketing 2

# Monitor resources
htop
sudo -u whatsapp-user pm2 monit
```

### Database Optimization
```sql
-- Connect to database
psql -U whatsapp_user -d whatsapp_marketing -h localhost

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_user_id ON whatsapp_numbers(user_id);
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# From your local machine
SERVER_IP=your.server.ip SERVER_USER=your_username npm run server:deploy
```

### Backup
```bash
# Database backup
sudo -u postgres pg_dump whatsapp_marketing > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /opt/whatsapp-marketing
```

## 📞 Support

### Log Locations
- Application logs: `/var/log/whatsapp-app/`
- Nginx logs: `/var/log/nginx/`
- PM2 logs: `sudo -u whatsapp-user pm2 logs`

### Common Issues
1. **Port 3000 already in use**: Stop existing processes
2. **Database connection failed**: Check PostgreSQL service
3. **Nginx 502 error**: Check if application is running
4. **WhatsApp QR not showing**: Check Chrome installation

## ✅ Quick Verification

After setup, verify everything works:

1. **Application running**: `sudo -u whatsapp-user pm2 status`
2. **Web access**: Open `http://your.server.ip`
3. **Database**: Connect and query
4. **WhatsApp**: Generate QR code
5. **File uploads**: Test media upload

---

## 🎯 One-Line Setup Summary

For experienced users:
```bash
# Server setup + deployment in one go:
curl -sSL https://raw.githubusercontent.com/Ank199899/whatsapp/master/scripts/install-server.sh | bash && \
SERVER_IP=your.server.ip npm run server:deploy
```

**🎉 Your WhatsApp Marketing Application will be live at `http://your.server.ip`**
