const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
const { MONGODB_HOST, MONGODB_PORT, MONGODB_USERNAME, MONGODB_PASSWORD }
  = process.env;

const { NATS_HOST, NATS_PORT, NATS_USERNAME, NATS_PASSWORD } = process.env;

// 新增环境变量定义
const { 
  CLOUDWATCH_ACCESS_KEY_ID,
  CLOUDWATCH_SECRET_ACCESS_KEY,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  BILIBILI_SECRET,
  KWAI_SECRET,
  PINTEREST_SECRET,
  TIKTOK_CLIENT_SECRET,
  TWITTER_CLIENT_SECRET,
  META_FACEBOOK_CLIENT_SECRET,
  META_THREADS_CLIENT_SECRET,
  META_INSTAGRAM_CLIENT_SECRET,
  WXPLAT_SECRET,
  WXPLAT_ENCODING_AES_KEY,
  YOUTUBE_SECRET,
  // 新增Google OAuth相关环境变量
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_AUTH_BACK_HOST,
  BILIBILI_AUTH_BACK_HOST,
  KWAI_AUTH_BACK_HOST,
  PINTEREST_AUTH_BACK_HOST,
  TIKTOK_REDIRECT_URI,
  TWITTER_REDIRECT_URI,
  META_FACEBOOK_REDIRECT_URI,
  META_THREADS_REDIRECT_URI,
  META_INSTAGRAM_REDIRECT_URI,
  WXPLAT_AUTH_BACK_HOST,
  YOUTUBE_AUTH_BACK_HOST
} = process.env;

module.exports = {
  port: 7001,
  env: 'development',
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
      accessKeyId: CLOUDWATCH_ACCESS_KEY_ID,
      secretAccessKey: CLOUDWATCH_SECRET_ACCESS_KEY,
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
    dbName: 'aitoearn_channel',
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
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    bucketName: 'aitoearn',
    hostUrl: 'https://x.com',
  },
  bullmq: {
    connection: {
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      password: REDIS_PASSWORD,
      db: 2,
    },
    prefix: 'dev',
  },
  bilibili: {
    id: '366126e90baf4f25',
    secret: BILIBILI_SECRET,
  },
  google: {
    id: GOOGLE_OAUTH_CLIENT_ID || '',
    secret: GOOGLE_OAUTH_CLIENT_SECRET || '',
    authBackHost: GOOGLE_AUTH_BACK_HOST || '',
  },
  kwai: {
    id: 'x',
    secret: KWAI_SECRET,
    authBackHost: KWAI_AUTH_BACK_HOST,
  },
  pinterest: {
    id: '1521759',
    secret: PINTEREST_SECRET,
    authBackHost: PINTEREST_AUTH_BACK_HOST,
    baseUrl: 'https://x.com',
  },
  tiktok: {
    clientId: 'x',
    clientSecret: TIKTOK_CLIENT_SECRET,
    redirectUri: TIKTOK_REDIRECT_URI,
  },
  twitter: {
    clientId: 'x',
    clientSecret: TWITTER_CLIENT_SECRET,
    redirectUri: TWITTER_REDIRECT_URI,
  },
  meta: {
    facebook: {
      clientId: 'x',
      clientSecret: META_FACEBOOK_CLIENT_SECRET,
      configId: 'x',
      redirectUri: META_FACEBOOK_REDIRECT_URI,
    },
    threads: {
      clientId: 'x',
      clientSecret: META_THREADS_CLIENT_SECRET,
      redirectUri: META_THREADS_REDIRECT_URI,
    },
    instagram: {
      clientId: 'x',
      clientSecret: META_INSTAGRAM_CLIENT_SECRET,
      redirectUri: META_INSTAGRAM_REDIRECT_URI,
    },
  },

  wxPlat: {
    id: 'x',
    secret: WXPLAT_SECRET,
    token: 'aitoearn',
    encodingAESKey: WXPLAT_ENCODING_AES_KEY,
    authBackHost: WXPLAT_AUTH_BACK_HOST,
  },
  myWxPlat: {
    id: 'dev',
    secret: WXPLAT_SECRET,
    hostUrl: 'https://x.ai',
  },
  youtube: {
    id: 'x',
    secret: YOUTUBE_SECRET,
    authBackHost:
      YOUTUBE_AUTH_BACK_HOST,
  },
};