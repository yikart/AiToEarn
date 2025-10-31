const os = require('node:os')

const {
  REDIS_HOST,
  REDIS_PORT,
} = process.env

const {
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_USERNAME,
  MONGODB_PASSWORD,
} = process.env

const {
  APP_ENV,
  APP_NAME,
  APP_DOMAIN,
} = process.env

const {
  SERVER_URL,
} = process.env

const {
  FEISHU_WEBHOOK_URL,
  FEISHU_WEBHOOK_SECRET,
} = process.env

const {
  BILIBILI_CLIENT_ID,
  BILIBILI_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  KWAI_CLIENT_ID,
  KWAI_CLIENT_SECRET,
  PINTEREST_CLIENT_ID,
  PINTEREST_CLIENT_SECRET,
  PINTEREST_TEST_AUTHORIZATION,
  TIKTOK_CLIENT_ID,
  TIKTOK_CLIENT_SECRET,
  TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,
  FACEBOOK_CONFIG_ID,
  THREADS_CLIENT_ID,
  THREADS_CLIENT_SECRET,
  INSTAGRAM_CLIENT_ID,
  INSTAGRAM_CLIENT_SECRET,
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET,
  WXPLAT_APP_ID,
  WXPLAT_APP_SECRET,
  WXPLAT_ENCODING_AES_KEY,
} = process.env

const {
  ALI_GREEN_ACCESS_KEY_ID,
  ALI_GREEN_ACCESS_KEY_SECRET,
} = process.env

const {
  INTERNAL_TOKEN,
} = process.env

module.exports = {
  port: 7001,
  env: 'production',
  enableBadRequestDetails: true,
  logger: {
    console: {
      enable: false,
      level: 'debug',
    },
    cloudWatch: {
      enable: true,
      region: 'ap-southeast-1',
      group: `aitoearn-apps/${APP_ENV}/${APP_NAME}`,
      stream: `${os.hostname()}`,
    },
    feishu: {
      enable: true,
      url: FEISHU_WEBHOOK_URL,
      secret: FEISHU_WEBHOOK_SECRET,
    },
  },
  redis: {
    nodes: [{
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
    }],
    options: {
      redisOptions: {
        db: 1,
        tls: {},
      },
    },
  },
  mongodb: {
    uri: `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}:${MONGODB_PORT}/?tls=true&tlsCAFile=global-bundle.pem&retryWrites=false`,
    dbName: 'aitoearn_channel',
  },
  awsS3: {
    region: 'ap-southeast-1',
    bucketName: 'aitoearn',
    endpoint: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com',
  },
  bilibili: {
    id: BILIBILI_CLIENT_ID,
    secret: BILIBILI_CLIENT_SECRET,
    authBackHost: `https://${APP_DOMAIN}/api/plat/bilibili/auth/back`,
  },
  google: {
    id: GOOGLE_CLIENT_ID,
    secret: GOOGLE_CLIENT_SECRET,
    authBackHost: '',
  },
  kwai: {
    id: KWAI_CLIENT_ID,
    secret: KWAI_CLIENT_SECRET,
    authBackHost: `https://${APP_DOMAIN}/api/plat/kwai/auth/back`,
  },
  pinterest: {
    id: PINTEREST_CLIENT_ID,
    secret: PINTEREST_CLIENT_SECRET,
    authBackHost: `https://${APP_DOMAIN}/api/plat/pinterest/authWebhook`,
    baseUrl: 'https://api.pinterest.com',
    test_authorization: PINTEREST_TEST_AUTHORIZATION,
  },
  tiktok: {
    clientId: TIKTOK_CLIENT_ID,
    clientSecret: TIKTOK_CLIENT_SECRET,
    redirectUri: `https://${APP_DOMAIN}/api/plat/tiktok/auth/back`,
    scopes: [
      'user.info.basic',
      'user.info.profile',
      'video.upload',
      'video.publish',
    ],
  },
  twitter: {
    clientId: TWITTER_CLIENT_ID,
    clientSecret: TWITTER_CLIENT_SECRET,
    redirectUri: `https://${APP_DOMAIN}/api/plat/twitter/auth/back`,
  },
  oauth: {
    facebook: {
      clientId: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
      configId: FACEBOOK_CONFIG_ID,
      redirectUri: `https://${APP_DOMAIN}/api/plat/meta/auth/back`,
      scopes: [
        'public_profile',
        'pages_show_list',
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_read_user_content',
        'pages_manage_engagement',
        'read_insights',
      ],
    },
    threads: {
      clientId: THREADS_CLIENT_ID,
      clientSecret: THREADS_CLIENT_SECRET,
      redirectUri: `https://${APP_DOMAIN}/api/plat/meta/auth/back`,
      scopes: [
        'threads_basic',
        'threads_content_publish',
        'threads_read_replies',
        'threads_manage_replies',
        'threads_manage_insights',
        'threads_location_tagging',
      ],
    },
    instagram: {
      clientId: INSTAGRAM_CLIENT_ID,
      clientSecret: INSTAGRAM_CLIENT_SECRET,
      redirectUri: `https://${APP_DOMAIN}/api/plat/meta/auth/back`,
      scopes: [
        'instagram_business_basic',
        'instagram_business_manage_comments',
        'instagram_business_content_publish',
      ],
    },
    linkedin: {
      clientId: LINKEDIN_CLIENT_ID,
      clientSecret: LINKEDIN_CLIENT_SECRET,
      redirectUri: `https://${APP_DOMAIN}/api/plat/meta/auth/back`,
      scopes: ['openid', 'profile', 'email', 'w_member_social'],
    },
  },

  wxPlat: {
    id: WXPLAT_APP_ID,
    secret: WXPLAT_APP_SECRET,
    token: 'aitoearn',
    encodingAESKey: WXPLAT_ENCODING_AES_KEY,
    authBackHost: `https://${APP_DOMAIN}/platcallback`,
  },
  myWxPlat: {
    id: 'dev',
    secret: 'f1a36f23d027c969d6c6969423d72eda',
    hostUrl: `https://wxplat.${APP_DOMAIN}`,
  },
  youtube: {
    id: YOUTUBE_CLIENT_ID,
    secret: YOUTUBE_CLIENT_SECRET,
    authBackHost: `https://${APP_DOMAIN}/api/plat/youtube/auth/callback`,
  },
  aliGreen: {
    accessKeyId: ALI_GREEN_ACCESS_KEY_ID,
    accessKeySecret: ALI_GREEN_ACCESS_KEY_SECRET,
    endpoint: `green-cip.cn-beijing.aliyuncs.com`,
  },
  server: {
    baseUrl: SERVER_URL,
    token: INTERNAL_TOKEN,
  },
}
