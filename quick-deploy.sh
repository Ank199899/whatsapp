#!/bin/bash

# Quick deployment script for WhatsApp application
# Run this on your Ubuntu server: 192.168.29.147

echo "🚀 Quick WhatsApp App Deployment"

# Go to the correct directory
cd /opt/whatsapp-marketing

# Stop any existing processes
echo "Stopping existing processes..."
pm2 stop whatsapp-marketing 2>/dev/null || true
pm2 delete whatsapp-marketing 2>/dev/null || true

# Pull latest code
echo "Pulling latest code..."
git pull origin master

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Start with PM2
echo "Starting application..."
pm2 start dist/index.js --name "whatsapp-marketing" --watch

# Save PM2 configuration
pm2 save

echo "✅ Deployment complete!"
echo "Check status: pm2 status"
echo "View logs: pm2 logs whatsapp-marketing"
echo "Access app: http://192.168.29.147:3000"
