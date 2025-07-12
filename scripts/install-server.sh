#!/bin/bash

# WhatsApp Marketing Application - One-Command Server Installation
# This script installs everything needed on Ubuntu server

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

echo "🚀 WhatsApp Marketing Application - Server Installation"
echo "======================================================"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as regular user with sudo access."
   exit 1
fi

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

print_status "Firewall status:"
sudo ufw status

echo ""
echo "✅ Server installation completed successfully!"
echo "============================================="
echo ""
echo "📋 Next Steps:"
echo "1. Run: npm run server:deploy (to deploy application)"
echo "2. Or manually upload files and run: npm run server:setup"
echo ""
echo "🔧 Server Information:"
echo "Server ready for WhatsApp Marketing Application"
echo "Database: whatsapp_marketing"
echo "Database User: whatsapp_user"
echo "Application Directory: /opt/whatsapp-marketing"
