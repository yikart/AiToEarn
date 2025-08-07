const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  WX_PLAT_ID,
  WX_PLAT_SECRET,
  WX_PLAT_TOKEN,
  WX_PLAT_ENCODING_AES_KEY
} = process.env;

module.exports = {
  port: 7001,
  env: 'production',
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
    id: WX_PLAT_ID,
    secret: WX_PLAT_SECRET,
    token: WX_PLAT_TOKEN,
    encodingAESKey: WX_PLAT_ENCODING_AES_KEY,
    authBackHost: 'https://mcp.aitoearn.cn',
  },
  msgUrlList: [
    'https://local.aitoearn.ai',
    'https://dev.aitoearn.ai',
    'https://aitoearn.ai',
  ],
  authUrlMap: {
    local: 'https://local.aitoearn.ai',
    dev: 'https://dev.aitoearn.ai',
    prod: 'https://aitoearn.ai',
  },
};
