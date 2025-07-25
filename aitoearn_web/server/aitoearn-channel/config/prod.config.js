const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
} = process.env
const {
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_USERNAME,
  MONGODB_PASSWORD,
} = process.env

const {
  NATS_HOST,
  NATS_PORT,
  NATS_USERNAME,
  NATS_PASSWORD,
} = process.env

const {
  OSS_KEY_ID,
  OSS_KEY_SECRET,
  OSS_BUCKET,
  OSS_REGION,
} = process.env

const {
  BILIBILI_ID,
  BILIBILI_SECRET,
  BILIBILI_AUTH_HOST,
} = process.env

const {
  GOOGLE_ID,
  GOOGLE_SECRET,
  GOOGLE_AUTH_HOST,
} = process.env

const {
  KWAI_ID,
  KWAI_SECRET,
  KWAI_AUTH_HOST,
} = process.env

const {
  PINTEREST_ID,
  PINTEREST_SECRET,
  PINTEREST_AUTH_HOST,
} = process.env

const {
  TIKTOK_ID,
  TIKTOK_SECRET,
  TIKTOK_REDIRECT_URI,
} = process.env

const {
  TWITTER_ID,
  TWITTER_SECRET,
  TWITTER_REDIRECT_URI,
} = process.env

const {
  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,
  FACEBOOK_CONFIG_ID,
} = process.env

const {
  THREADS_CLIENT_ID,
  THREADS_CLIENT_SECRET,
  THREADS_REDIRECT_URI,
} = process.env

const {
  INSTAGRAM_CLIENT_ID,
  INSTAGRAM_CLIENT_SECRET,
  INSTAGRAM_REDIRECT_URI,
} = process.env

const {
  WX_PLAT_ID,
  WX_PLAT_SECRET,
  WX_PLAT_TOKEN,
  WX_PLAT_AES_KEY,
  WX_PLAT_AUTH_HOST,
} = process.env

const {
  YOUTOBE_ID,
  YOUTOBE_SECRET,
  YOUTOBE_SECRET_AUTH_HOST,
} = process.env

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
  mongodb: {
    uri: `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}:${MONGODB_PORT}/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`,
    dbName: 'aitoearn_pro',
  },
  nats: {
    name: 'aitoearn-channel-pro',
    servers: [`nats://${NATS_USERNAME}:${NATS_PASSWORD}@${NATS_HOST}:${NATS_PORT}`],
    user: NATS_USERNAME,
    pass: NATS_PASSWORD,
    prefix: 'pro',
  },
  oss: {
    options: {
      region: OSS_REGION,
      accessKeyId: OSS_KEY_ID,
      accessKeySecret: OSS_KEY_SECRET,
      bucket: OSS_BUCKET,
      secret: 'true',
    },
    hostUrl: 'https://file.aitoearn.com',
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
    authBackHost: BILIBILI_AUTH_HOST,
  },
  google: {
    id: GOOGLE_ID,
    secret: GOOGLE_SECRET,
    authBackHost: GOOGLE_AUTH_HOST,
  },
  kwai: {
    id: KWAI_ID,
    secret: KWAI_SECRET,
    authBackHost: KWAI_AUTH_HOST,
  },
  pinterest: {
    id: PINTEREST_ID,
    secret: PINTEREST_SECRET,
    authBackHost: PINTEREST_AUTH_HOST,
    baseUrl: 'https://api-sandbox.pinterest.com',
  },
  tiktok: {
    clientId: TIKTOK_ID,
    clientSecret: TIKTOK_SECRET,
    redirectUri: TIKTOK_REDIRECT_URI,
  },
  twitter: {
    clientId: TWITTER_ID,
    clientSecret: TWITTER_SECRET,
    redirectUri: TWITTER_REDIRECT_URI,
  },
  meta: {
    facebook: {
      clientId: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
      configId: FACEBOOK_CONFIG_ID,
    },
    threads: {
      clientId: THREADS_CLIENT_ID,
      clientSecret: THREADS_CLIENT_SECRET,
      redirectUri: THREADS_REDIRECT_URI,
    },
    instagram: {
      clientId: INSTAGRAM_CLIENT_ID,
      clientSecret: INSTAGRAM_CLIENT_SECRET,
      redirectUri: INSTAGRAM_REDIRECT_URI,
    },
  },

  wxPlat: {
    id: WX_PLAT_ID,
    secret: WX_PLAT_SECRET,
    token: WX_PLAT_TOKEN,
    encodingAESKey: WX_PLAT_AES_KEY,
    authBackHost: WX_PLAT_AUTH_HOST,
  },
  youtube: {
    id: YOUTOBE_ID,
    secret: YOUTOBE_SECRET,
    authBackHost:
      YOUTOBE_SECRET_AUTH_HOST,
  },
}
