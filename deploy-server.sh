#!/bin/bash

# WhatsApp Bulk Marketing Application Deployment Script
# For Ubuntu Server 192.168.29.147

set -e  # Exit on any error

echo "🚀 Starting WhatsApp Application Deployment..."

# Configuration
REPO_URL="https://github.com/Ank199899/whatsapp.git"
APP_DIR="/opt/whatsapp-marketing"
APP_NAME="whatsapp-marketing"
PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y curl wget git build-essential

# Install Node.js 20.x
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js installed: $NODE_VERSION"
print_success "NPM installed: $NPM_VERSION"

# Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2

# Create application directory
print_status "Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or update repository
if [ -d ".git" ]; then
    print_status "Updating existing repository..."
    git fetch origin
    git reset --hard origin/master
    git clean -fd
else
    print_status "Cloning repository..."
    git clone $REPO_URL .
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the application
print_status "Building application..."
npm run build

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/whatsapp_db"

# Supabase Configuration (if using Supabase)
SUPABASE_URL="your_supabase_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# Server Configuration
PORT=$PORT
NODE_ENV=production

# Session Secret
SESSION_SECRET="your_random_session_secret_here"

# WhatsApp Configuration
WHATSAPP_SESSION_PATH="./whatsapp-web-sessions"
EOF
    print_warning "Please edit .env file with your actual configuration values"
fi

# Create uploads directory
mkdir -p uploads/media

# Set proper permissions
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Stop existing PM2 process if running
print_status "Stopping existing PM2 processes..."
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'dist/index.js',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup systemd -u root --hp /root

# Install and configure Nginx (optional)
read -p "Do you want to install and configure Nginx as reverse proxy? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Installing Nginx..."
    apt install -y nginx
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and restart Nginx
    nginx -t && systemctl restart nginx
    systemctl enable nginx
    
    print_success "Nginx configured and started"
fi

# Configure firewall
print_status "Configuring firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow $PORT
ufw --force enable

# Display status
print_status "Checking application status..."
pm2 status

print_success "🎉 Deployment completed successfully!"
print_success "Application is running on port $PORT"
print_success "You can access it at: http://192.168.29.147:$PORT"

if command -v nginx &> /dev/null; then
    print_success "Nginx is also configured at: http://192.168.29.147"
fi

print_status "Useful commands:"
echo "  - Check logs: pm2 logs $APP_NAME"
echo "  - Restart app: pm2 restart $APP_NAME"
echo "  - Stop app: pm2 stop $APP_NAME"
echo "  - Monitor: pm2 monit"
echo "  - Update app: cd $APP_DIR && git pull && npm install && npm run build && pm2 restart $APP_NAME"

print_warning "Don't forget to:"
echo "  1. Edit .env file with your database and API credentials"
echo "  2. Set up your database (PostgreSQL or Supabase)"
echo "  3. Configure your WhatsApp API settings"
