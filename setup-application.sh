#!/bin/bash

# WhatsApp Marketing Application - Application Setup Script
# Run this after uploading application files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

echo "🚀 Setting up WhatsApp Marketing Application..."
echo "=============================================="

print_step "1. Setting up application files"
cd /opt/whatsapp-marketing

# Check if application files exist
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please upload your application files first."
    exit 1
fi

print_status "Setting correct ownership..."
sudo chown -R whatsapp-user:whatsapp-user /opt/whatsapp-marketing

print_step "2. Creating environment configuration"
print_status "Creating .env file..."

sudo -u whatsapp-user tee /opt/whatsapp-marketing/.env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://whatsapp_user:WhatsApp@2024!@localhost:5432/whatsapp_marketing

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Session Configuration
SESSION_SECRET=whatsapp_marketing_super_secret_session_key_2024_very_long_and_secure_random_string

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=/var/whatsapp-sessions
WHATSAPP_MAX_SESSIONS=10

# File Upload Configuration
UPLOAD_PATH=/var/whatsapp-uploads
MAX_FILE_SIZE=10485760

# Security Configuration
CORS_ORIGIN=http://192.168.29.147
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/whatsapp-app/app.log

# Development/Production flags
DISABLE_AUTH=true
AUTO_ADMIN=true
EOF

sudo chmod 600 /opt/whatsapp-marketing/.env

print_step "3. Installing application dependencies"
print_status "Installing Node.js dependencies..."
sudo -u whatsapp-user bash -c "cd /opt/whatsapp-marketing && npm install"

print_step "4. Building application"
print_status "Building the application..."
sudo -u whatsapp-user bash -c "cd /opt/whatsapp-marketing && npm run build"

print_step "5. Setting up database"
print_status "Running database migrations..."
sudo -u whatsapp-user bash -c "cd /opt/whatsapp-marketing && npm run db:push" || print_warning "Database migration failed - will try manual setup"

print_step "6. Creating PM2 configuration"
sudo -u whatsapp-user tee /opt/whatsapp-marketing/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'whatsapp-marketing',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    log_file: '/var/log/whatsapp-app/combined.log',
    out_file: '/var/log/whatsapp-app/out.log',
    error_file: '/var/log/whatsapp-app/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    watch: false,
    env_file: '.env',
    node_args: '--max-old-space-size=2048'
  }]
};
EOF

print_step "7. Configuring Nginx"
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/whatsapp-marketing << 'EOF'
server {
    listen 80;
    server_name 192.168.29.147;
    
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    client_max_body_size 50M;
    
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
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
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/whatsapp-marketing /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

print_step "8. Setting up PM2"
print_status "Configuring PM2 startup..."
sudo -u whatsapp-user pm2 startup | grep "sudo" | bash || print_warning "PM2 startup configuration may need manual setup"

print_step "9. Starting application"
print_status "Starting WhatsApp Marketing application..."
sudo -u whatsapp-user bash -c "cd /opt/whatsapp-marketing && pm2 start ecosystem.config.js --env production"
sudo -u whatsapp-user pm2 save

print_step "10. Creating management scripts"
sudo tee /opt/whatsapp-marketing/start.sh << 'EOF'
#!/bin/bash
cd /opt/whatsapp-marketing
sudo -u whatsapp-user pm2 start ecosystem.config.js --env production
EOF

sudo tee /opt/whatsapp-marketing/stop.sh << 'EOF'
#!/bin/bash
sudo -u whatsapp-user pm2 stop whatsapp-marketing
EOF

sudo tee /opt/whatsapp-marketing/restart.sh << 'EOF'
#!/bin/bash
sudo -u whatsapp-user pm2 restart whatsapp-marketing
EOF

sudo tee /opt/whatsapp-marketing/status.sh << 'EOF'
#!/bin/bash
sudo -u whatsapp-user pm2 status
sudo -u whatsapp-user pm2 logs whatsapp-marketing --lines 20
EOF

sudo chmod +x /opt/whatsapp-marketing/*.sh

echo ""
echo "✅ Application setup completed!"
echo "==============================="
echo ""
echo "🌐 Access your application at: http://192.168.29.147"
echo ""
echo "📊 Management Commands:"
echo "  Start:   /opt/whatsapp-marketing/start.sh"
echo "  Stop:    /opt/whatsapp-marketing/stop.sh"
echo "  Restart: /opt/whatsapp-marketing/restart.sh"
echo "  Status:  /opt/whatsapp-marketing/status.sh"
echo ""
echo "📝 View logs: sudo -u whatsapp-user pm2 logs whatsapp-marketing"
echo "📊 Monitor:   sudo -u whatsapp-user pm2 monit"
echo ""

# Show current status
print_status "Current application status:"
sudo -u whatsapp-user pm2 status
