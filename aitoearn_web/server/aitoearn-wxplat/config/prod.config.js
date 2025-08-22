const { 
  REDIS_HOST, 
  REDIS_PORT, 
  REDIS_PASSWORD,
  WXPLAT_SECRET,
  WXPLAT_ENCODING_AES_KEY
} = process.env;

module.exports = {
  port: 7000,
  env: 'development',
  enableBadRequestDetails: true,
  docs: {
    enabled: false,
    path: '/doc',
  },
  redis: {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    password: REDIS_PASSWORD,
    db: 1,
    connectTimeout: 10000,
  },
  wxPlat: {
    id: 'x',
    secret: WXPLAT_SECRET,
    token: 'x',
    encodingAESKey: WXPLAT_ENCODING_AES_KEY,
    authBackHost: 'https://mcp.x.cn',
  },
  msgUrlList: [
    'https://dev.x.ai/api/plat/wx/callback/msg',
    'https://x.ai/api/plat/wx/callback/msg',
  ],
  authUrlMap: {
    dev: 'https://dev.x.ai/api/plat/wx/auth/back',
    prod: 'https://x.ai/api/plat/wx/auth/back',
  },
};