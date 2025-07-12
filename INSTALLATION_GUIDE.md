# 🚀 WhatsApp Marketing Application - Server Installation Guide

## Server Details
- **IP Address**: 192.168.29.147
- **Username**: admin1
- **Password**: admin

## 📋 Quick Installation Steps

### Step 1: Prepare Your Server
```bash
# Connect to your server
ssh admin1@192.168.29.147

# Download and run the server preparation script
wget https://raw.githubusercontent.com/your-repo/install-whatsapp-server.sh
chmod +x install-whatsapp-server.sh
./install-whatsapp-server.sh
```

### Step 2: Transfer Application Files

**Option A: From your local machine (recommended)**
```bash
# In your WhatsApp application directory on local machine
chmod +x transfer-files.sh
./transfer-files.sh
```

**Option B: Manual transfer using SCP**
```bash
# From your local WhatsApp app directory
scp -r ./* admin1@192.168.29.147:/opt/whatsapp-marketing/
```

**Option C: Using Git (if you have a repository)**
```bash
# On the server
ssh admin1@192.168.29.147
cd /opt/whatsapp-marketing
git clone https://github.com/your-username/whatsapp-app.git .
sudo chown -R whatsapp-user:whatsapp-user /opt/whatsapp-marketing
```

### Step 3: Setup Application
```bash
# On the server
ssh admin1@192.168.29.147
cd /opt/whatsapp-marketing
chmod +x setup-application.sh
./setup-application.sh
```

## 🎯 One-Command Installation

If you want to do everything in one go:

```bash
# 1. First, run server preparation
ssh admin1@192.168.29.147 'curl -sSL https://raw.githubusercontent.com/your-repo/install-whatsapp-server.sh | bash'

# 2. Then transfer files and setup (from your local machine)
./transfer-files.sh
```

## 📊 Post-Installation

### Access Your Application
- **URL**: http://192.168.29.147
- **Admin Dashboard**: Direct access (no login required in development mode)

### Management Commands
```bash
# Start application
/opt/whatsapp-marketing/start.sh

# Stop application
/opt/whatsapp-marketing/stop.sh

# Restart application
/opt/whatsapp-marketing/restart.sh

# Check status and logs
/opt/whatsapp-marketing/status.sh
```

### Monitor Application
```bash
# SSH to server
ssh admin1@192.168.29.147

# Check PM2 status
sudo -u whatsapp-user pm2 status

# View logs
sudo -u whatsapp-user pm2 logs whatsapp-marketing

# Monitor in real-time
sudo -u whatsapp-user pm2 monit
```

## 🔧 Configuration Details

### Database
- **Host**: localhost
- **Port**: 5432
- **Database**: whatsapp_marketing
- **Username**: whatsapp_user
- **Password**: WhatsApp@2024!

### Application
- **Port**: 3000
- **Environment**: production
- **Process Manager**: PM2
- **Web Server**: Nginx (reverse proxy)

### File Locations
- **Application**: /opt/whatsapp-marketing
- **Logs**: /var/log/whatsapp-app/
- **Sessions**: /var/whatsapp-sessions/
- **Uploads**: /var/whatsapp-uploads/
- **Backups**: /var/backups/whatsapp-marketing/

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

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -U whatsapp_user -d whatsapp_marketing -h localhost -c "SELECT version();"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### WhatsApp Connection Problems
```bash
# Clear sessions and restart
sudo rm -rf /var/whatsapp-sessions/*
sudo -u whatsapp-user pm2 restart whatsapp-marketing
```

## 🔒 Security Notes

### Firewall Configuration
- Port 22 (SSH): Open
- Port 80 (HTTP): Open
- Port 443 (HTTPS): Open
- Port 5432 (PostgreSQL): Localhost only
- All other ports: Blocked

### User Permissions
- Application runs as: whatsapp-user
- Web server runs as: www-data
- Database runs as: postgres

## 📈 Performance Optimization

### For High Load
```bash
# Increase PM2 instances
sudo -u whatsapp-user pm2 scale whatsapp-marketing 2

# Monitor resource usage
htop
sudo -u whatsapp-user pm2 monit
```

### Database Optimization
```sql
-- Connect to database
psql -U whatsapp_user -d whatsapp_marketing -h localhost

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_numbers_user_id ON whatsapp_numbers(user_id);
```

## 🔄 Backup and Maintenance

### Manual Backup
```bash
# Database backup
sudo -u postgres pg_dump whatsapp_marketing > /var/backups/whatsapp-marketing/backup_$(date +%Y%m%d_%H%M%S).sql

# Application files backup
tar -czf /var/backups/whatsapp-marketing/app_backup_$(date +%Y%m%d_%H%M%S).tar.gz /opt/whatsapp-marketing
```

### Automated Backups
Backups are automatically configured to run daily at 2 AM.

## 📞 Support

If you encounter any issues:
1. Check the logs: `sudo -u whatsapp-user pm2 logs whatsapp-marketing`
2. Verify all services are running: `./status.sh`
3. Check system resources: `htop` and `df -h`
4. Review this troubleshooting guide

## ✅ Installation Checklist

- [ ] Server preparation completed
- [ ] Application files transferred
- [ ] Dependencies installed
- [ ] Database configured
- [ ] Application built successfully
- [ ] PM2 configured and running
- [ ] Nginx configured and running
- [ ] Firewall configured
- [ ] Application accessible via browser
- [ ] WhatsApp QR code generation working
- [ ] Database connections working
- [ ] File uploads working

---

**🎉 Congratulations! Your WhatsApp Marketing Application is now running on your server!**
