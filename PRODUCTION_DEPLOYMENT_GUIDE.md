# 🚀 Production Deployment Guide - Dell PowerEdge Server

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 4GB (8GB+ recommended)
- **Storage**: 50GB+ free space
- **Network**: Static IP address
- **Ports**: 3000, 80, 443 open

### Software Requirements
- Node.js 18+ 
- npm/yarn
- PM2 (Process Manager)
- Nginx (Reverse Proxy)
- Git

## 🔧 Step 1: Server Preparation

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should be 18+
npm --version
```

### 1.3 Install PM2 Globally
```bash
sudo npm install -g pm2
pm2 --version
```

### 1.4 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 📦 Step 2: Deploy Application

### 2.1 Clone Repository
```bash
cd /opt
sudo git clone https://github.com/Ank199899/whatsapp.git whatsapp-app
sudo chown -R $USER:$USER /opt/whatsapp-app
cd /opt/whatsapp-app
```

### 2.2 Install Dependencies
```bash
npm install --production
```

### 2.3 Build Application
```bash
npm run build
```

### 2.4 Create Environment File
```bash
cp .env.backup .env
nano .env
```

**Edit .env file:**
```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Session Secret
SESSION_SECRET=your-super-secret-key-change-this

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🚀 Step 3: PM2 Configuration

### 3.1 Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'whatsapp-app',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};
```

### 3.2 Create Logs Directory
```bash
mkdir -p logs
```

### 3.3 Start Application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Step 4: Nginx Configuration

### 4.1 Create Nginx Site Configuration
```bash
sudo nano /etc/nginx/sites-available/whatsapp-app
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-server-ip-or-domain;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### 4.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Step 5: SSL Certificate (Optional but Recommended)

### 5.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Get SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

## 🔥 Step 6: Firewall Configuration

### 6.1 Configure UFW
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw enable
```

## 📊 Step 7: Monitoring & Maintenance

### 7.1 PM2 Monitoring
```bash
pm2 status
pm2 logs whatsapp-app
pm2 monit
```

### 7.2 System Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

## 🚀 Quick Start Script

Create a deployment script:
```bash
nano deploy.sh
chmod +x deploy.sh
```

**deploy.sh:**
```bash
#!/bin/bash
echo "🚀 Deploying WhatsApp Application..."

# Pull latest changes
git pull origin master

# Install dependencies
npm install --production

# Build application
npm run build

# Restart PM2
pm2 restart whatsapp-app

echo "✅ Deployment complete!"
echo "🌐 Access your app at: http://your-server-ip"
```

## 🔧 Troubleshooting

### Common Issues:

1. **Port 3000 already in use:**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 PID
   ```

2. **PM2 not starting:**
   ```bash
   pm2 delete all
   pm2 start ecosystem.config.js
   ```

3. **Nginx errors:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Application logs:**
   ```bash
   pm2 logs whatsapp-app --lines 100
   ```

## 📱 Access Your Application

After successful deployment:
- **HTTP**: `http://your-server-ip`
- **HTTPS**: `https://your-domain.com` (if SSL configured)
- **WhatsApp Interface**: `http://your-server-ip/inbox`
- **API**: `http://your-server-ip/api/*`

## 🔄 Auto-Deployment with GitHub Webhooks

For automatic deployments when you push to GitHub, set up a webhook that triggers the deploy.sh script.

---

**Need help?** Check the logs and ensure all services are running:
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status ufw
```
