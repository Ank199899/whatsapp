#!/bin/bash

# WhatsApp Marketing Application - Easy Universal Deployment Script
# Works on Ubuntu, CentOS, Debian, and other Linux distributions
# Usage: ./easy-deploy.sh [server_ip] [username] [port]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_PORT=3000
DEFAULT_USERNAME="admin1"
APP_NAME="whatsapp-marketing"

# Parse arguments
SERVER_IP=${1:-""}
USERNAME=${2:-$DEFAULT_USERNAME}
PORT=${3:-$DEFAULT_PORT}

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  WhatsApp Marketing - Easy Deployment Script  ${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists apt-get; then
            echo "ubuntu"
        elif command_exists yum; then
            echo "centos"
        elif command_exists dnf; then
            echo "fedora"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

# Function to install Node.js based on OS
install_nodejs() {
    local os=$(detect_os)
    print_step "Installing Node.js 18..."
    
    case $os in
        "ubuntu")
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        "centos"|"fedora")
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
            ;;
        "macos")
            if command_exists brew; then
                brew install node@18
            else
                print_error "Please install Homebrew first or install Node.js manually"
                exit 1
            fi
            ;;
        *)
            print_error "Unsupported OS. Please install Node.js 18 manually"
            exit 1
            ;;
    esac
}

# Function to install PM2
install_pm2() {
    print_step "Installing PM2..."
    sudo npm install -g pm2
}

# Function to setup application locally
setup_local() {
    print_header
    print_step "Setting up WhatsApp Marketing Application locally..."
    
    # Check Node.js
    if ! command_exists node; then
        install_nodejs
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 16 ]; then
            print_error "Node.js version 16+ required. Current: $(node --version)"
            install_nodejs
        else
            print_success "Node.js $(node --version) found"
        fi
    fi
    
    # Check PM2
    if ! command_exists pm2; then
        install_pm2
    else
        print_success "PM2 found"
    fi
    
    # Install dependencies
    print_step "Installing dependencies..."
    npm install
    
    # Build application
    print_step "Building application..."
    npm run build
    
    # Create logs directory
    mkdir -p logs
    
    # Create .env if not exists
    if [ ! -f ".env" ]; then
        print_step "Creating .env file..."
        cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=file:./whatsapp.db

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Session Configuration
SESSION_SECRET=whatsapp-marketing-super-secret-key-change-this-in-production

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./whatsapp-web-sessions
WHATSAPP_MAX_SESSIONS=10

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Security Configuration
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Development/Production flags
DISABLE_AUTH=true
AUTO_ADMIN=true
EOF
        print_success "Created .env file"
    fi
    
    # Setup database
    print_step "Setting up database..."
    npm run db:push
    
    # Stop any existing PM2 process
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Start application
    print_step "Starting application with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    # Setup PM2 startup
    print_step "Setting up PM2 startup..."
    pm2 startup | grep "sudo" | bash || true
    
    print_success "Application deployed successfully!"
    echo ""
    echo -e "${GREEN}🌐 Application URL: http://localhost:$PORT${NC}"
    echo -e "${GREEN}📱 WhatsApp Interface: http://localhost:$PORT/inbox${NC}"
    echo ""
    echo -e "${BLUE}📊 Monitoring Commands:${NC}"
    echo -e "  pm2 status                    - Check status"
    echo -e "  pm2 logs $APP_NAME           - View logs"
    echo -e "  pm2 restart $APP_NAME        - Restart app"
    echo -e "  pm2 stop $APP_NAME           - Stop app"
    echo ""
}

# Function to deploy to remote server
deploy_remote() {
    if [ -z "$SERVER_IP" ]; then
        print_error "Server IP is required for remote deployment"
        echo "Usage: $0 <server_ip> [username] [port]"
        echo "Example: $0 192.168.1.230 admin1 3000"
        exit 1
    fi
    
    print_header
    print_step "Deploying to remote server: $SERVER_IP"
    print_info "Username: $USERNAME"
    print_info "Port: $PORT"
    
    # Test SSH connection
    print_step "Testing SSH connection..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $USERNAME@$SERVER_IP exit 2>/dev/null; then
        print_error "Cannot connect to $USERNAME@$SERVER_IP"
        print_info "Please ensure SSH access is configured"
        exit 1
    fi
    print_success "SSH connection successful"
    
    # Build locally first
    print_step "Building application locally..."
    npm install
    npm run build
    
    # Copy files to server
    print_step "Copying files to server..."
    ssh $USERNAME@$SERVER_IP "mkdir -p /opt/$APP_NAME"
    rsync -avz --progress \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='whatsapp-web-sessions' \
        --exclude='uploads' \
        --exclude='auth_info_*' \
        ./ $USERNAME@$SERVER_IP:/opt/$APP_NAME/
    
    # Setup on remote server
    print_step "Setting up on remote server..."
    ssh $USERNAME@$SERVER_IP << EOF
cd /opt/$APP_NAME

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install dependencies
npm install --production

# Create directories
mkdir -p logs uploads whatsapp-web-sessions

# Create .env if not exists
if [ ! -f ".env" ]; then
    cat > .env << 'ENVEOF'
DATABASE_URL=file:./whatsapp.db
PORT=$PORT
HOST=0.0.0.0
NODE_ENV=production
SESSION_SECRET=whatsapp-marketing-super-secret-key-change-this-in-production
WHATSAPP_SESSION_PATH=./whatsapp-web-sessions
WHATSAPP_MAX_SESSIONS=10
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
DISABLE_AUTH=true
AUTO_ADMIN=true
ENVEOF
fi

# Setup database
npm run db:push

# Stop existing process
pm2 delete $APP_NAME 2>/dev/null || true

# Start application
pm2 start ecosystem.config.js --env production
pm2 save

# Setup startup
pm2 startup | grep "sudo" | bash || true

echo "✅ Deployment completed successfully!"
EOF
    
    print_success "Remote deployment completed!"
    echo ""
    echo -e "${GREEN}🌐 Application URL: http://$SERVER_IP:$PORT${NC}"
    echo -e "${GREEN}📱 WhatsApp Interface: http://$SERVER_IP:$PORT/inbox${NC}"
    echo ""
    echo -e "${BLUE}📊 Remote Monitoring:${NC}"
    echo -e "  ssh $USERNAME@$SERVER_IP 'pm2 status'"
    echo -e "  ssh $USERNAME@$SERVER_IP 'pm2 logs $APP_NAME'"
    echo ""
}

# Main execution
if [ -z "$1" ]; then
    # No arguments - setup locally
    setup_local
else
    # Arguments provided - deploy to remote server
    deploy_remote
fi
