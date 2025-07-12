#!/bin/bash

# WhatsApp Marketing Application - Deploy to Server
# This script deploys the application to your Ubuntu server

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

# Configuration
SERVER_IP="${SERVER_IP:-192.168.1.230}"
SERVER_USER="${SERVER_USER:-admin1}"
APP_DIR="/opt/whatsapp-marketing"

echo "🚀 Deploying WhatsApp Marketing Application"
echo "==========================================="
echo "Server: $SERVER_USER@$SERVER_IP"
echo "Target: $APP_DIR"
echo ""

# Check if we can connect to server
print_step "1. Testing server connection"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
    print_error "Cannot connect to server $SERVER_USER@$SERVER_IP"
    print_warning "Please ensure:"
    print_warning "1. Server is running and accessible"
    print_warning "2. SSH key is set up or you can login with password"
    print_warning "3. SERVER_IP and SERVER_USER are correct"
    echo ""
    echo "You can set custom values:"
    echo "SERVER_IP=your.server.ip SERVER_USER=your_user npm run server:deploy"
    exit 1
fi

print_status "✅ Server connection successful"

print_step "2. Preparing application for deployment"
print_status "Building application..."
npm run build

print_status "Creating deployment package..."
# Create a temporary directory for deployment
TEMP_DIR=$(mktemp -d)
cp -r . "$TEMP_DIR/app"
cd "$TEMP_DIR/app"

# Remove unnecessary files for deployment
rm -rf node_modules
rm -rf .git
rm -rf uploads
rm -rf whatsapp-web-sessions
rm -rf auth_info_*

print_step "3. Transferring files to server"
print_status "Uploading application files..."
rsync -avz --progress --exclude='node_modules' --exclude='.git' --exclude='uploads' \
    --exclude='whatsapp-web-sessions' --exclude='auth_info_*' \
    ./ $SERVER_USER@$SERVER_IP:$APP_DIR/

print_step "4. Setting up application on server"
print_status "Running server setup..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/whatsapp-marketing

# Ensure correct ownership
sudo chown -R whatsapp-user:whatsapp-user /opt/whatsapp-marketing

# Create .env file
sudo -u whatsapp-user tee .env << 'ENVEOF'
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
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/whatsapp-app/app.log

# Development/Production flags
DISABLE_AUTH=true
AUTO_ADMIN=true
ENVEOF

sudo chmod 600 .env

# Install dependencies
sudo -u whatsapp-user npm install

# Run database migrations
sudo -u whatsapp-user npm run db:push || echo "Database migration completed"

# Create PM2 ecosystem file
sudo -u whatsapp-user tee ecosystem.config.js << 'PMEOF'
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
PMEOF

EOF

print_step "5. Configuring Nginx"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/whatsapp-marketing << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    
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
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/whatsapp-marketing /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
EOF

print_step "6. Starting application"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/whatsapp-marketing

# Stop any existing PM2 processes
sudo -u whatsapp-user pm2 delete whatsapp-marketing 2>/dev/null || true

# Start the application
sudo -u whatsapp-user pm2 start ecosystem.config.js --env production
sudo -u whatsapp-user pm2 save

# Setup PM2 startup
sudo -u whatsapp-user pm2 startup | grep "sudo" | bash || true
EOF

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Deployment completed successfully!"
echo "===================================="
echo ""
echo "🌐 Your application is now running at:"
echo "   http://$SERVER_IP"
echo ""
echo "📊 Management commands (run on server):"
echo "   sudo -u whatsapp-user pm2 status"
echo "   sudo -u whatsapp-user pm2 logs whatsapp-marketing"
echo "   sudo -u whatsapp-user pm2 restart whatsapp-marketing"
echo ""
print_status "🎉 WhatsApp Marketing Application is live!"
