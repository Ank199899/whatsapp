# 🐳 WhatsApp Marketing Application - Docker Setup

## 🚀 Super Easy Docker Deployment

### Prerequisites
- Docker and Docker Compose installed on your server
- Ubuntu 18.04+ or any Docker-compatible OS

### One-Command Setup

**Option 1: Using Docker Compose (Recommended)**
```bash
# Clone and start
git clone https://github.com/Ank199899/whatsapp.git
cd whatsapp
docker-compose up -d
```

**Option 2: Direct Docker Run**
```bash
# Run PostgreSQL
docker run -d --name whatsapp-postgres \
  -e POSTGRES_DB=whatsapp_marketing \
  -e POSTGRES_USER=whatsapp_user \
  -e POSTGRES_PASSWORD=WhatsApp@2024! \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

# Run WhatsApp App
docker run -d --name whatsapp-app \
  --link whatsapp-postgres:postgres \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://whatsapp_user:WhatsApp@2024!@postgres:5432/whatsapp_marketing \
  whatsapp-marketing:latest
```

## 📋 Docker Compose Setup (Full Stack)

### 1. Clone Repository
```bash
git clone https://github.com/Ank199899/whatsapp.git
cd whatsapp
```

### 2. Start Services
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Access Application
```
Open browser: http://your-server-ip
```

## 🔧 Configuration

### Environment Variables
Edit `docker-compose.yml` to customize:

```yaml
environment:
  NODE_ENV: production
  PORT: 3000
  DATABASE_URL: postgresql://whatsapp_user:WhatsApp@2024!@postgres:5432/whatsapp_marketing
  SESSION_SECRET: your_secret_key
  CORS_ORIGIN: "*"
  DISABLE_AUTH: "true"
```

### Volumes
Data is persisted in Docker volumes:
- `postgres_data`: Database data
- `whatsapp_sessions`: WhatsApp sessions
- `whatsapp_uploads`: Uploaded files
- `whatsapp_logs`: Application logs

## 📊 Management Commands

### Docker Compose Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f whatsapp-app

# Update application
docker-compose pull
docker-compose up -d
```

### Individual Container Commands
```bash
# Check application logs
docker logs whatsapp-marketing -f

# Access application container
docker exec -it whatsapp-marketing bash

# Check database
docker exec -it whatsapp-postgres psql -U whatsapp_user -d whatsapp_marketing

# Restart application
docker restart whatsapp-marketing
```

## 🔒 Security Features

### Network Isolation
- All services run in isolated Docker network
- Database not exposed to external network
- Only HTTP/HTTPS ports exposed

### Data Protection
- Database credentials in environment variables
- Persistent volumes for data storage
- Non-root user in containers

## 🛠️ Troubleshooting

### Application Won't Start
```bash
# Check container status
docker-compose ps

# View application logs
docker-compose logs whatsapp-app

# Restart services
docker-compose restart
```

### Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Test database connection
docker exec -it whatsapp-postgres psql -U whatsapp_user -d whatsapp_marketing -c "SELECT version();"

# Restart database
docker-compose restart postgres
```

### Port Conflicts
```bash
# Check what's using port 3000
sudo netstat -tulpn | grep :3000

# Change port in docker-compose.yml
ports:
  - "8080:3000"  # Use port 8080 instead
```

## 📈 Scaling and Performance

### Scale Application
```bash
# Run multiple app instances
docker-compose up -d --scale whatsapp-app=3

# Use load balancer
# Add nginx service to docker-compose.yml
```

### Resource Limits
```yaml
# In docker-compose.yml
services:
  whatsapp-app:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin master

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Backup Data
```bash
# Backup database
docker exec whatsapp-postgres pg_dump -U whatsapp_user whatsapp_marketing > backup.sql

# Backup volumes
docker run --rm -v whatsapp_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Restore Data
```bash
# Restore database
docker exec -i whatsapp-postgres psql -U whatsapp_user whatsapp_marketing < backup.sql

# Restore volumes
docker run --rm -v whatsapp_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## 🌐 Production Deployment

### With SSL/HTTPS
```yaml
# Add to docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### With Domain Name
```bash
# Update nginx.conf
server_name yourdomain.com www.yourdomain.com;
```

## ✅ Quick Verification

After setup, verify everything works:

1. **Services running**: `docker-compose ps`
2. **Application accessible**: `curl http://localhost:3000`
3. **Database connected**: Check application logs
4. **WhatsApp working**: Generate QR code in browser

## 🎯 Complete Setup Commands

For copy-paste deployment:

```bash
# Install Docker (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy application
git clone https://github.com/Ank199899/whatsapp.git
cd whatsapp
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

**🎉 Your WhatsApp Marketing Application is now running in Docker!**

Access at: `http://your-server-ip`
