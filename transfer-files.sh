#!/bin/bash

# File Transfer Script for WhatsApp Marketing Application
# Run this on your LOCAL machine to transfer files to the server

echo "📁 WhatsApp Application File Transfer Script"
echo "==========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Server details
SERVER_IP="192.168.29.147"
SERVER_USER="admin1"
SERVER_PATH="/opt/whatsapp-marketing"

# Get current directory (should be your WhatsApp app directory)
CURRENT_DIR=$(pwd)

echo "Current directory: $CURRENT_DIR"
echo "Server: $SERVER_USER@$SERVER_IP"
echo "Destination: $SERVER_PATH"
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in current directory!"
    print_error "Please run this script from your WhatsApp application root directory."
    exit 1
fi

print_status "Found package.json - proceeding with file transfer..."

# Create exclusion list for rsync
cat > .rsync-exclude << 'EOF'
node_modules/
.git/
.env
dist/
*.log
.DS_Store
.vscode/
.idea/
auth_info_*/
whatsapp-web-sessions/
uploads/
*.tar.gz
*.zip
.npm/
.cache/
coverage/
.nyc_output/
EOF

print_status "Created exclusion list for file transfer..."

# Method 1: Using rsync (recommended)
echo ""
echo "🚀 Transfer Method 1: Using rsync (recommended)"
echo "================================================"
echo "This will sync your application files to the server."
echo "You'll be prompted for the server password: admin"
echo ""
read -p "Press Enter to start rsync transfer, or Ctrl+C to cancel..."

print_status "Starting rsync transfer..."
rsync -avz --progress --exclude-from=.rsync-exclude \
    --delete \
    ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH/

if [ $? -eq 0 ]; then
    print_status "✅ Files transferred successfully using rsync!"
else
    print_error "❌ Rsync transfer failed. Trying alternative method..."
    
    # Method 2: Using tar and scp
    echo ""
    echo "🚀 Transfer Method 2: Using tar + scp"
    echo "====================================="
    
    print_status "Creating tar archive..."
    tar --exclude-from=.rsync-exclude -czf whatsapp-app.tar.gz .
    
    print_status "Transferring archive to server..."
    scp whatsapp-app.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
    
    if [ $? -eq 0 ]; then
        print_status "Archive transferred. Extracting on server..."
        ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/whatsapp-marketing
sudo rm -rf * 2>/dev/null || true
sudo tar -xzf /tmp/whatsapp-app.tar.gz
sudo chown -R whatsapp-user:whatsapp-user /opt/whatsapp-marketing
rm /tmp/whatsapp-app.tar.gz
EOF
        print_status "✅ Files transferred and extracted successfully!"
        rm whatsapp-app.tar.gz
    else
        print_error "❌ SCP transfer failed."
        rm whatsapp-app.tar.gz 2>/dev/null || true
    fi
fi

# Clean up
rm .rsync-exclude 2>/dev/null || true

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. SSH to your server: ssh admin1@192.168.29.147"
echo "2. Run the setup script: cd /opt/whatsapp-marketing && ./setup-application.sh"
echo ""
echo "🔧 Or run the complete setup remotely:"
echo "ssh admin1@192.168.29.147 'cd /opt/whatsapp-marketing && ./setup-application.sh'"
echo ""

# Option to run setup remotely
echo ""
read -p "Would you like to run the application setup now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running application setup on server..."
    ssh $SERVER_USER@$SERVER_IP 'cd /opt/whatsapp-marketing && chmod +x setup-application.sh && ./setup-application.sh'
    
    if [ $? -eq 0 ]; then
        echo ""
        print_status "🎉 Installation completed successfully!"
        print_status "🌐 Your WhatsApp application is now available at: http://192.168.29.147"
        echo ""
        echo "📊 To monitor your application:"
        echo "  ssh admin1@192.168.29.147"
        echo "  sudo -u whatsapp-user pm2 status"
        echo "  sudo -u whatsapp-user pm2 logs whatsapp-marketing"
    else
        print_error "Setup script failed. Please check the server logs."
    fi
fi
