module.exports = {
  apps: [
    {
      name: 'aitoearn-channel-server',
      script: 'dist/src/main.js',
      args: '-c config/local.config.js',
      instances: '1',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD_HH:mm Z',
      merge_logs: true,
    },
  ],
}
