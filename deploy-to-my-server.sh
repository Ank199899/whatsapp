#!/bin/bash

# 🚀 Quick Deploy to Your Dell PowerEdge Server
# Server IP: 192.168.1.230

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER_IP="192.168.1.230"
USERNAME="admin1"
APP_DIR="/opt/whatsapp-app"

echo -e "${GREEN}🚀 Deploying WhatsApp App to Dell PowerEdge Server${NC}"
echo -e "${BLUE}Server: $SERVER_IP${NC}"
echo -e "${BLUE}User: $USERNAME${NC}"
echo "=============================================="

# Check if we can connect to the server
echo -e "${YELLOW}📡 Testing connection to server...${NC}"
if ! ping -c 1 $SERVER_IP &> /dev/null; then
    echo -e "${RED}❌ Cannot reach server $SERVER_IP${NC}"
    echo "Please check:"
    echo "  1. Server is powered on"
    echo "  2. Network connection"
    echo "  3. IP address is correct"
    exit 1
fi

echo -e "${GREEN}✅ Server is reachable${NC}"

# Function to run commands on remote server
run_remote() {
    echo -e "${BLUE}🔧 Running: $1${NC}"
    ssh $USERNAME@$SERVER_IP "$1"
}

# Function to copy files to remote server
copy_to_server() {
    echo -e "${BLUE}📁 Copying: $1 -> $2${NC}"
    scp -r $1 $USERNAME@$SERVER_IP:$2
}

echo ""
echo -e "${YELLOW}📋 Step 1: Preparing server...${NC}"

# Create application directory on server
run_remote "sudo mkdir -p $APP_DIR && sudo chown -R $USERNAME:$USERNAME $APP_DIR"

echo ""
echo -e "${YELLOW}📦 Step 2: Copying application files...${NC}"

# Copy all files except node_modules and .git
rsync -av --progress --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='logs' ./ $USERNAME@$SERVER_IP:$APP_DIR/

echo ""
echo -e "${YELLOW}🔧 Step 3: Installing dependencies on server...${NC}"

# Install Node.js if not present
run_remote "
if ! command -v node &> /dev/null; then
    echo 'Installing Node.js...'
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo 'Node.js already installed: '$(node --version)
fi
"

# Install PM2 if not present
run_remote "
if ! command -v pm2 &> /dev/null; then
    echo 'Installing PM2...'
    sudo npm install -g pm2
else
    echo 'PM2 already installed: '$(pm2 --version)
fi
"

echo ""
echo -e "${YELLOW}🚀 Step 4: Starting application...${NC}"

# Run the production startup script on server
run_remote "cd $APP_DIR && chmod +x start-production.sh && ./start-production.sh"

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=============================================="
echo -e "${GREEN}🌐 Application URL: http://$SERVER_IP:3000${NC}"
echo -e "${GREEN}📱 WhatsApp Interface: http://$SERVER_IP:3000/inbox${NC}"
echo -e "${GREEN}🔧 API Endpoints: http://$SERVER_IP:3000/api/*${NC}"
echo ""
echo -e "${BLUE}📊 To monitor the application:${NC}"
echo "  ssh $USERNAME@$SERVER_IP"
echo "  cd $APP_DIR"
echo "  pm2 status"
echo "  pm2 logs whatsapp-app"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "  1. SSH to server and configure .env file"
echo "  2. Restart app: pm2 restart whatsapp-app"
echo "  3. Set up Nginx reverse proxy (optional)"
echo "  4. Configure firewall rules"
echo ""
echo -e "${GREEN}🎉 Your WhatsApp application is now running on your Dell PowerEdge server!${NC}"
