module.exports = {
  apps: [
    {
      name: 'pgfn-automation',
      script: './run.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001, // Porta diferente da aplicação principal (3000)
        LOG_LEVEL: 'info'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        LOG_LEVEL: 'debug'
      },
      
      // Configurações específicas da automação (modo contínuo)
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      merge_logs: true,
      time: true
    },
    
    // Servidor de monitoramento contínuo (opcional)
    {
      name: 'pgfn-monitor',
      script: './run.js',
      args: '--server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-monitor-error.log',
      out_file: './logs/pm2-monitor-out.log',
      log_file: './logs/pm2-monitor-combined.log',
      merge_logs: true,
      time: true
    }
  ]
};
