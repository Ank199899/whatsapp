#!/bin/bash

# Complete WhatsApp Marketing Application Installation Script
# Run this on your server: ssh admin1@192.168.29.147

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

echo "🚀 WhatsApp Marketing Application - Complete Installation"
echo "========================================================"
echo "Server: 192.168.29.147"
echo "User: admin1"
echo ""

print_step "1. System Update and Essential Packages"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim htop unzip software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release build-essential

print_step "2. Creating Application User"
if id "whatsapp-user" &>/dev/null; then
    print_warning "User whatsapp-user already exists"
else
    sudo useradd -m -s /bin/bash whatsapp-user
    print_status "Created user: whatsapp-user"
fi
sudo usermod -aG sudo whatsapp-user

print_step "3. Creating Directories"
sudo mkdir -p /opt/whatsapp-marketing
sudo mkdir -p /var/log/whatsapp-app
sudo mkdir -p /var/whatsapp-sessions
sudo mkdir -p /var/whatsapp-uploads/media
sudo mkdir -p /var/backups/whatsapp-marketing

print_step "4. Setting Directory Permissions"
sudo chown whatsapp-user:whatsapp-user /opt/whatsapp-marketing
sudo chown whatsapp-user:whatsapp-user /var/log/whatsapp-app
sudo chown whatsapp-user:whatsapp-user /var/whatsapp-sessions
sudo chown whatsapp-user:whatsapp-user /var/whatsapp-uploads

print_step "5. Installing Node.js 18 LTS"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2 typescript tsx
print_status "Node.js $(node --version) installed"
print_status "NPM $(npm --version) installed"

print_step "6. Installing PostgreSQL"
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

print_status "Creating database and user..."
sudo -u postgres psql << 'EOSQL'
DROP DATABASE IF EXISTS whatsapp_marketing;
DROP USER IF EXISTS whatsapp_user;
CREATE DATABASE whatsapp_marketing;
CREATE USER whatsapp_user WITH ENCRYPTED PASSWORD 'WhatsApp@2024!';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_marketing TO whatsapp_user;
ALTER USER whatsapp_user CREATEDB;
\q
EOSQL
print_status "Database configured"

print_step "7. Installing Google Chrome"
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable

# Install Puppeteer dependencies
sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
    libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
    libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
    fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils
print_status "Chrome and dependencies installed"

print_step "8. Installing Nginx"
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
print_status "Nginx installed and started"

print_step "9. Configuring Firewall"
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 127.0.0.1 to any port 5432
sudo ufw default deny incoming
sudo ufw default allow outgoing
print_status "Firewall configured"

print_step "10. Server Preparation Complete!"
echo ""
echo "📋 NEXT STEPS:"
echo "=============="
echo "1. Upload your WhatsApp application files to: /opt/whatsapp-marketing"
echo "2. Run the application setup script"
echo ""
echo "🔧 Transfer Methods:"
echo "From your local machine:"
echo "  rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' \\"
echo "    ./ admin1@192.168.29.147:/opt/whatsapp-marketing/"
echo ""
echo "Or using SCP:"
echo "  tar --exclude='node_modules' --exclude='.git' -czf app.tar.gz ."
echo "  scp app.tar.gz admin1@192.168.29.147:/tmp/"
echo ""
echo "✅ Server is ready for application deployment!"
