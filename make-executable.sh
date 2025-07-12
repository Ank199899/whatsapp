#!/bin/bash

# Make all scripts executable
echo "🔧 Making all scripts executable..."

# Main setup scripts
chmod +x setup.sh
chmod +x install.sh

# Scripts directory
chmod +x scripts/install-server.sh
chmod +x scripts/deploy-server.sh
chmod +x scripts/setup-server.sh

# Legacy scripts
chmod +x setup-application.sh
chmod +x install-whatsapp-server.sh

# Other deployment scripts
chmod +x complete-install.sh 2>/dev/null || true
chmod +x deploy-server.sh 2>/dev/null || true
chmod +x deploy-to-my-server.sh 2>/dev/null || true
chmod +x deploy-to-server.sh 2>/dev/null || true
chmod +x install-whatsapp-server.sh 2>/dev/null || true
chmod +x quick-deploy.sh 2>/dev/null || true
chmod +x server-deploy-commands.sh 2>/dev/null || true
chmod +x start-production.sh 2>/dev/null || true
chmod +x transfer-files.sh 2>/dev/null || true

echo "✅ All scripts are now executable!"
echo ""
echo "🚀 Quick setup options:"
echo "1. Universal setup: ./setup.sh"
echo "2. One-command install: ./install.sh"
echo "3. Server preparation: ./scripts/install-server.sh"
echo "4. Application setup: ./scripts/setup-server.sh"
echo "5. Remote deployment: npm run server:deploy"
echo ""
echo "📚 Documentation:"
echo "- Easy Setup: EASY_SERVER_SETUP.md"
echo "- Docker Setup: DOCKER_SETUP.md"
echo "- Installation Guide: INSTALLATION_GUIDE.md"
