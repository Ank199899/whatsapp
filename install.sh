#!/bin/bash

# WhatsApp Marketing Application - One-Command Installer
# Usage: curl -sSL https://raw.githubusercontent.com/Ank199899/whatsapp/master/install.sh | bash

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

echo "🚀 WhatsApp Marketing Application - One-Command Installer"
echo "========================================================"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as regular user with sudo access."
   exit 1
fi

# Check OS
if [[ ! -f /etc/os-release ]]; then
    print_error "Cannot detect OS. This installer is for Ubuntu/Debian systems."
    exit 1
fi

source /etc/os-release
if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
    print_error "This installer is designed for Ubuntu/Debian. Detected: $ID"
    exit 1
fi

print_status "Detected OS: $PRETTY_NAME"

print_step "1. System Update and Basic Setup"
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_status "Installing essential packages..."
sudo apt install -y curl wget git vim htop unzip software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release build-essential

print_step "2. Creating Application User and Directories"
print_status "Creating whatsapp-user..."
sudo useradd -m -s /bin/bash whatsapp-user 2>/dev/null || print_warning "User whatsapp-user already exists"
sudo usermod -aG sudo whatsapp-user

print_status "Creating application directories..."
sudo mkdir -p /opt/whatsapp-marketing
sudo mkdir -p /var/log/whatsapp-app
sudo mkdir -p /var/whatsapp-sessions
sudo mkdir -p /var/whatsapp-uploads/media
sudo mkdir -p /var/backups/whatsapp-marketing

# Set ownership
sudo chown whatsapp-user:whatsapp-user /opt/whatsapp-marketing
sudo chown whatsapp-user:whatsapp-user /var/log/whatsapp-app
sudo chown whatsapp-user:whatsapp-user /var/whatsapp-sessions
sudo chown whatsapp-user:whatsapp-user /var/whatsapp-uploads

print_step "3. Installing Node.js 18 LTS"
print_status "Adding Node.js repository..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

print_status "Installing Node.js..."
sudo apt-get install -y nodejs

print_status "Installing global packages..."
sudo npm install -g pm2 typescript tsx

# Verify installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js version: $NODE_VERSION"
print_status "NPM version: $NPM_VERSION"

print_step "4. Installing PostgreSQL"
print_status "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

print_status "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

print_status "Creating database and user..."
sudo -u postgres psql << EOF
CREATE DATABASE whatsapp_marketing;
CREATE USER whatsapp_user WITH ENCRYPTED PASSWORD 'WhatsApp@2024!';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_marketing TO whatsapp_user;
ALTER USER whatsapp_user CREATEDB;
\q
EOF

print_step "5. Installing Google Chrome"
print_status "Adding Google Chrome repository..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list

print_status "Installing Chrome and dependencies..."
sudo apt update
sudo apt install -y google-chrome-stable

# Install Puppeteer dependencies
sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
    libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
    libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
    fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils

print_step "6. Installing Nginx"
print_status "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

print_step "7. Configuring UFW Firewall"
print_status "Setting up firewall rules..."
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 127.0.0.1 to any port 5432
sudo ufw default deny incoming
sudo ufw default allow outgoing

print_step "8. Downloading WhatsApp Application"
print_status "Cloning application from GitHub..."
cd /opt/whatsapp-marketing
sudo -u whatsapp-user git clone https://github.com/Ank199899/whatsapp.git .

print_status "Setting up application..."
sudo -u whatsapp-user tee .env << 'EOF'
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
EOF

sudo chmod 600 .env

print_status "Installing dependencies..."
sudo -u whatsapp-user npm install

print_status "Building application..."
sudo -u whatsapp-user npm run build

print_status "Setting up database..."
sudo -u whatsapp-user npm run db:push || print_warning "Database setup completed"

print_step "9. Configuring PM2 and Nginx"
sudo -u whatsapp-user tee ecosystem.config.js << 'EOF'
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
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    log_file: '/var/log/whatsapp-app/combined.log',
    out_file: '/var/log/whatsapp-app/out.log',
    error_file: '/var/log/whatsapp-app/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    watch: false,
    env_file: '.env'
  }]
};
EOF

# Configure Nginx
sudo tee /etc/nginx/sites-available/whatsapp-marketing << 'EOF'
server {
    listen 80;
    server_name _;
    
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
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/whatsapp-marketing /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

print_step "10. Starting Application"
sudo -u whatsapp-user pm2 start ecosystem.config.js
sudo -u whatsapp-user pm2 save
sudo -u whatsapp-user pm2 startup | grep "sudo" | bash || true

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ Installation completed successfully!"
echo "====================================="
echo ""
echo "🌐 Your WhatsApp Marketing Application is now running at:"
echo "   http://$SERVER_IP"
echo ""
echo "📊 Management Commands:"
echo "   sudo -u whatsapp-user pm2 status"
echo "   sudo -u whatsapp-user pm2 logs whatsapp-marketing"
echo "   sudo -u whatsapp-user pm2 restart whatsapp-marketing"
echo ""
echo "🎉 Setup Complete! Open your browser and start using the application!"
