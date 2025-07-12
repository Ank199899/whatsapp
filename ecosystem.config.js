module.exports = {
  apps: [{
    name: 'whatsapp-marketing',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    // PM2 Configuration
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    
    // Logging
    log_file: '/var/log/whatsapp-app/combined.log',
    out_file: '/var/log/whatsapp-app/out.log',
    error_file: '/var/log/whatsapp-app/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Performance
    watch: false,
    ignore_watch: [
      'node_modules',
      'uploads',
      'whatsapp-web-sessions',
      'auth_info_*',
      '.git'
    ],
    
    // Environment file
    env_file: '.env',
    
    // Node.js options
    node_args: '--max-old-space-size=2048',
    
    // Auto restart on file changes (disabled for production)
    autorestart: true,
    
    // Merge logs from all instances
    merge_logs: true,
    
    // Time zone
    time: true,
    
    // Kill timeout
    kill_timeout: 5000,
    
    // Listen timeout
    listen_timeout: 8000,
    
    // Graceful shutdown
    shutdown_with_message: true
  }]
};
