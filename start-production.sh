#!/bin/bash

# 🚀 WhatsApp Application - Production Startup Script
# For Dell PowerEdge Server Deployment

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

echo "🚀 Starting WhatsApp Application in Production Mode"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the application root directory."
    exit 1
fi

print_step "1. Checking Node.js version"
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing PM2..."
    npm install -g pm2
fi

print_step "2. Setting environment to production"
export NODE_ENV=production

print_step "3. Installing production dependencies"
npm install --production

print_step "4. Building application"
npm run build

if [ ! -d "dist" ]; then
    print_error "Build failed. dist directory not found."
    exit 1
fi

print_step "5. Creating PM2 ecosystem file"
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'whatsapp-app',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

print_step "6. Creating logs directory"
mkdir -p logs

print_step "7. Checking environment file"
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from backup..."
    if [ -f ".env.backup" ]; then
        cp .env.backup .env
        print_status "Copied .env.backup to .env"
        print_warning "Please edit .env file with your production settings!"
    else
        print_error "No .env.backup found. Please create .env file manually."
        exit 1
    fi
fi

print_step "8. Stopping any existing PM2 processes"
pm2 delete whatsapp-app 2>/dev/null || true

print_step "9. Starting application with PM2"
pm2 start ecosystem.config.js

print_step "10. Saving PM2 configuration"
pm2 save

print_step "11. Setting up PM2 startup"
pm2 startup

echo ""
echo "✅ WhatsApp Application started successfully!"
echo "=================================================="
echo "🌐 Application URL: http://192.168.1.230:3000"
echo "📱 WhatsApp Interface: http://192.168.1.230:3000/inbox"
echo "🔧 API Endpoints: http://192.168.1.230:3000/api/*"
echo ""
echo "📊 Monitoring Commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs whatsapp-app - View application logs"
echo "  pm2 monit           - Real-time monitoring"
echo "  pm2 restart whatsapp-app - Restart application"
echo ""
echo "🔧 Configuration:"
echo "  Edit .env file for database and other settings"
echo "  Use 'pm2 restart whatsapp-app' after changing .env"
echo ""

# Show current status
print_step "Current PM2 Status:"
pm2 status

print_status "Production deployment complete! 🎉"
