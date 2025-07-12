#!/bin/bash

# 🚀 Deploy WhatsApp Application to Dell PowerEdge Server
# Quick deployment script for production server

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 WhatsApp Application - Server Deployment${NC}"
echo "=============================================="

# Check if server details are provided
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Usage: $0 <server-ip> [username]${NC}"
    echo "Example: $0 192.168.1.230 admin1"
    exit 1
fi

SERVER_IP=$1
USERNAME=${2:-admin1}
APP_DIR="/opt/whatsapp-app"

echo -e "${GREEN}Server IP: $SERVER_IP${NC}"
echo -e "${GREEN}Username: $USERNAME${NC}"
echo -e "${GREEN}App Directory: $APP_DIR${NC}"

# Function to run commands on remote server
run_remote() {
    ssh $USERNAME@$SERVER_IP "$1"
}

# Function to copy files to remote server
copy_to_server() {
    scp -r $1 $USERNAME@$SERVER_IP:$2
}

echo ""
echo "📋 Step 1: Preparing server..."

# Create application directory on server
run_remote "sudo mkdir -p $APP_DIR && sudo chown -R $USERNAME:$USERNAME $APP_DIR"

echo "📦 Step 2: Copying application files..."

# Copy all files except node_modules and .git
rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='logs' ./ $USERNAME@$SERVER_IP:$APP_DIR/

echo "🔧 Step 3: Installing dependencies on server..."

# Install Node.js if not present
run_remote "
if ! command -v node &> /dev/null; then
    echo 'Installing Node.js...'
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
"

# Install PM2 if not present
run_remote "
if ! command -v pm2 &> /dev/null; then
    echo 'Installing PM2...'
    sudo npm install -g pm2
fi
"

echo "🚀 Step 4: Starting application..."

# Run the production startup script on server
run_remote "cd $APP_DIR && chmod +x start-production.sh && ./start-production.sh"

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=============================================="
echo -e "${GREEN}🌐 Application URL: http://$SERVER_IP:3000${NC}"
echo -e "${GREEN}📱 WhatsApp Interface: http://$SERVER_IP:3000/inbox${NC}"
echo -e "${GREEN}🔧 API Endpoints: http://$SERVER_IP:3000/api/*${NC}"
echo ""
echo "📊 To monitor the application:"
echo "  ssh $USERNAME@$SERVER_IP"
echo "  cd $APP_DIR"
echo "  pm2 status"
echo "  pm2 logs whatsapp-app"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
echo "  1. Configure your .env file on the server"
echo "  2. Set up Nginx reverse proxy (optional)"
echo "  3. Configure firewall rules"
echo "  4. Set up SSL certificate (recommended)"
