const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
const { MONGODB_HOST, MONGODB_PORT, MONGODB_USERNAME, MONGODB_PASSWORD }
  = process.env;
const { NATS_HOST, NATS_PORT, NATS_USERNAME, NATS_PASSWORD } = process.env;
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
const { BILIBILI_ID, BILIBILI_SECRET } = process.env;
const { KWAI_ID, KWAI_SECRET } = process.env;
const { PINTEREST_ID, PINTEREST_SECRET, PINTEREST_TEST_AUTH } = process.env;
const { TIKTOK_CLIENT_ID, TIKTOK_CLIENT_SECRET } = process.env;
const { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET } = process.env;
const { META_FACEBOOK_CLIENT_ID, META_FACEBOOK_CLIENT_SECRET, META_FACEBOOK_CONFIG_ID } = process.env;
const { META_THREADS_CLIENT_ID, META_THREADS_CLIENT_SECRET } = process.env;
const { META_INSTAGRAM_CLIENT_ID, META_INSTAGRAM_CLIENT_SECRET } = process.env;
const { WX_PLAT_ID, WX_PLAT_SECRET, WX_PLAT_TOKEN, WX_PLAT_ENCODING_AES_KEY } = process.env;
const { MY_WX_PLAT_SECRET } = process.env;
const { YOUTUBE_ID, YOUTUBE_SECRET } = process.env;

module.exports = {
  port: 7001,
  env: 'production',
  enableBadRequestDetails: true,
  docs: {
    enabled: false,
    path: '/doc',
  },
  logger: {
    console: {
      enable: true,
      level: 'debug',
    },
    cloudWatch: {
      enable: true,
      region: 'ap-southeast-1',
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      group: 'aitoearn-apps',
      prefix: 'dev',
    },
  },
  redis: {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    password: REDIS_PASSWORD,
    db: 1,
    connectTimeout: 10000,
  },
  mongodb: {
    uri: `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}:${MONGODB_PORT}/`,
    dbName: 'aitoearn',
  },
  nats: {
    name: 'aitoearn-channel-dev',
    servers: [
      `nats://${NATS_USERNAME}:${NATS_PASSWORD}@${NATS_HOST}:${NATS_PORT}`,
    ],
    user: NATS_USERNAME,
    pass: NATS_PASSWORD,
    prefix: 'dev',
  },
  awsS3: {
    region: 'ap-southeast-1',
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    bucketName: 'aitoearn',
    hostUrl: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com',
  },
  bullmq: {
    connection: {
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      password: REDIS_PASSWORD,
      db: 2,
    },
  },
  bilibili: {
    id: BILIBILI_ID,
    secret: BILIBILI_SECRET,
    authBackHost: 'https://dev.aitoearn.ai/baseUrlProxy/plat/bilibili/auth/back',
  },
  google: {
    id: '',
    secret: '',
    authBackHost: '',
  },
  kwai: {
    id: KWAI_ID,
    secret: KWAI_SECRET,
    authBackHost: 'https://dev.aitoearn.ai/baseUrlProxy/plat/kwai/auth/back',
  },
  pinterest: {
    id: PINTEREST_ID,
    secret: PINTEREST_SECRET,
    authBackHost: 'https://dev.aitoearn.ai/baseUrlProxy/plat/pinterest/authWebhook',
    baseUrl: 'https://api-sandbox.pinterest.com',
    test_authorization: PINTEREST_TEST_AUTH,
  },
  tiktok: {
    clientId: TIKTOK_CLIENT_ID,
    clientSecret: TIKTOK_CLIENT_SECRET,
    redirectUri: 'https://dev.aitoearn.ai/platcallback/tiktok/auth/callback',
  },
  twitter: {
    clientId: TWITTER_CLIENT_ID,
    clientSecret: TWITTER_CLIENT_SECRET,
    redirectUri: 'https://dev.aitoearn.ai/platcallback/twitter/auth/callback',
  },
  meta: {
    facebook: {
      clientId: META_FACEBOOK_CLIENT_ID,
      clientSecret: META_FACEBOOK_CLIENT_SECRET,
      configId: META_FACEBOOK_CONFIG_ID,
      redirectUri: 'https://dev.aitoearn.ai/api/plat/meta/auth/back',
    },
    threads: {
      clientId: META_THREADS_CLIENT_ID,
      clientSecret: META_THREADS_CLIENT_SECRET,
      redirectUri: 'https://dev.aitoearn.ai/api/plat/meta/auth/back',
    },
    instagram: {
      clientId: META_INSTAGRAM_CLIENT_ID,
      clientSecret: META_INSTAGRAM_CLIENT_SECRET,
      redirectUri: 'https://dev.aitoearn.ai/api/plat/meta/auth/back',
    },
  },

  wxPlat: {
    id: WX_PLAT_ID,
    secret: WX_PLAT_SECRET,
    token: WX_PLAT_TOKEN,
    encodingAESKey: WX_PLAT_ENCODING_AES_KEY,
    authBackHost: 'https://dev.aitoearn.ai/platcallback',
  },
  myWxPlat: {
    id: 'aitoearnLocal',
    secret: MY_WX_PLAT_SECRET,
    hostUrl: 'https://mcp.aitoearn.cn',
  },
  youtube: {
    id: YOUTUBE_ID,
    secret: YOUTUBE_SECRET,
    authBackHost:
      'https://dev.aitoearn.ai/api/plat/youtube/auth/callback',
  },
};