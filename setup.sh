#!/bin/bash

# WhatsApp Marketing Application - Universal Setup Script
# Supports multiple deployment methods

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${CYAN}$1${NC}"
}

clear
print_header "🚀 WhatsApp Marketing Application - Universal Setup"
print_header "=================================================="
echo ""

print_header "Choose your deployment method:"
echo ""
echo "1. 🐳 Docker Compose (Recommended - Easiest)"
echo "2. 📦 Native Ubuntu Installation"
echo "3. ☁️  Remote Server Deployment"
echo "4. 🔧 Manual Setup (Advanced)"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        print_header "🐳 Docker Compose Setup"
        echo "========================"
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            print_step "Installing Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        fi
        
        # Check if Docker Compose is installed
        if ! command -v docker-compose &> /dev/null; then
            print_step "Installing Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        print_step "Starting WhatsApp Marketing Application..."
        docker-compose up -d
        
        print_status "✅ Application started successfully!"
        echo ""
        echo "🌐 Access your application at: http://$(hostname -I | awk '{print $1}')"
        echo "📊 Management: docker-compose logs -f"
        ;;
        
    2)
        print_header "📦 Native Ubuntu Installation"
        echo "============================="
        
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
        
        print_step "Running native installation..."
        chmod +x install.sh
        ./install.sh
        ;;
        
    3)
        print_header "☁️ Remote Server Deployment"
        echo "==========================="
        
        echo "Enter your server details:"
        read -p "Server IP: " SERVER_IP
        read -p "Username: " SERVER_USER
        
        if [[ -z "$SERVER_IP" || -z "$SERVER_USER" ]]; then
            print_error "Server IP and username are required."
            exit 1
        fi
        
        print_step "Testing connection to $SERVER_USER@$SERVER_IP..."
        if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
            print_error "Cannot connect to server. Please check your SSH setup."
            exit 1
        fi
        
        print_step "Deploying to remote server..."
        SERVER_IP=$SERVER_IP SERVER_USER=$SERVER_USER npm run server:deploy
        ;;
        
    4)
        print_header "🔧 Manual Setup"
        echo "==============="
        
        echo "Manual setup options:"
        echo "1. Server preparation only"
        echo "2. Application setup only"
        echo "3. Full manual setup"
        echo ""
        
        read -p "Choose option (1-3): " manual_choice
        
        case $manual_choice in
            1)
                print_step "Running server preparation..."
                chmod +x scripts/install-server.sh
                ./scripts/install-server.sh
                ;;
            2)
                print_step "Running application setup..."
                chmod +x scripts/setup-server.sh
                ./scripts/setup-server.sh
                ;;
            3)
                print_step "Running full manual setup..."
                chmod +x scripts/install-server.sh
                ./scripts/install-server.sh
                
                print_step "Now running application setup..."
                chmod +x scripts/setup-server.sh
                ./scripts/setup-server.sh
                ;;
            *)
                print_error "Invalid choice. Please run the script again."
                exit 1
                ;;
        esac
        ;;
        
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
print_header "🎉 Setup completed successfully!"
echo ""
print_status "Your WhatsApp Marketing Application is now ready to use!"
echo ""
print_header "📚 Documentation:"
echo "- Easy Setup Guide: EASY_SERVER_SETUP.md"
echo "- Docker Guide: DOCKER_SETUP.md"
echo "- Installation Guide: INSTALLATION_GUIDE.md"
echo ""
print_header "📊 Management Commands:"
echo "- Check status: sudo -u whatsapp-user pm2 status (native)"
echo "- View logs: docker-compose logs -f (docker)"
echo "- Restart: sudo -u whatsapp-user pm2 restart whatsapp-marketing (native)"
echo "- Restart: docker-compose restart (docker)"
