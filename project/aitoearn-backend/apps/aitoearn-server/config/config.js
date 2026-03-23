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
  ASSETS_CONFIG,
} = process.env

const {
  AI_URL,
} = process.env

const {
  JWT_SECRET,
  INTERNAL_TOKEN,
} = process.env

const {
  NODE_ENV,
  APP_DOMAIN,
} = process.env

const {
  MAIL_USER,
  MAIL_PASS,
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
  DOYIN_CLIENT_ID,
  DOYIN_CLIENT_SECRET,
} = process.env

const {
  ALI_SMS_ACCESS_KEY_ID,
  ALI_SMS_ACCESS_KEY_SECRET,
  ALI_SMS_SIGN_NAME,
  ALI_SMS_TEMPLATE_CODE,
} = process.env

const {
  RELAY_SERVER_URL,
  RELAY_API_KEY,
  RELAY_CALLBACK_URL,
} = process.env

module.exports = {
  // 应用基础
  appDomain: APP_DOMAIN,
  port: 3002,
  environment: NODE_ENV,
  enableBadRequestDetails: true,

  // 认证
  auth: {
    secret: JWT_SECRET,
    internalToken: INTERNAL_TOKEN,
  },

  // 日志
  logger: {
    console: {
      enable: true,
      level: 'debug',
      pretty: false,
    },
  },

  // 数据库
  mongodb: {
    uri: `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}:${MONGODB_PORT}/?authSource=admin&directConnection=true`,
    dbName: 'aitoearn',
  },

  // 缓存/队列
  redis: {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    username: 'default',
    password: REDIS_PASSWORD,
  },
  redlock: {
    redis: {
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      username: 'default',
      password: REDIS_PASSWORD,
    },
  },

  // Channel
  channel: {
    channelDb: {
      uri: `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}:${MONGODB_PORT}/?authSource=admin&directConnection=true`,
      dbName: 'aitoearn_channel',
    },
    moreApi: {
      platApiUri: 'https://platapi.yikart.cn',
      xhsCreatorUri: 'http://39.106.41.190:7008',
    },
    shortLink: {
      baseUrl: `https://${APP_DOMAIN}/api/shortLink/`,
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
    googleBusiness: {
      clientId: '',
      clientSecret: '',
      redirectUri: `https://${APP_DOMAIN}/api/plat/google-business/auth/callback`,
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
      promotionRedirectUri: `https://${APP_DOMAIN}/api/plat/tiktok/auth/redirect`,
      scopes: [
        'user.info.basic',
        'user.info.profile',
        'video.upload',
        'video.publish',
      ],
      promotionBaseUrl: `https://${APP_DOMAIN}/promo`,
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
        promotionRedirectUri: `https://${APP_DOMAIN}/api/plat/meta/auth/redirect`,
        promotionBaseUrl: `https://${APP_DOMAIN}/promo`,
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
    douyin: {
      id: DOYIN_CLIENT_ID,
      secret: DOYIN_CLIENT_SECRET,
      authBackHost: `https://${APP_DOMAIN}/api/plat/douyin/auth/back`,
    },
  },

  // 外部服务
  assets: JSON.parse(ASSETS_CONFIG),
  mail: {
    transport: {
      host: 'email-smtp.ap-southeast-1.amazonaws.com',
      port: 587,
      secure: false,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    },
    defaults: {
      from: 'noreply@tx.aitoearn.ai',
    },
  },
  aliSms: {
    accessKeyId: ALI_SMS_ACCESS_KEY_ID,
    accessKeySecret: ALI_SMS_ACCESS_KEY_SECRET,
    signName: ALI_SMS_SIGN_NAME,
    templateCode: ALI_SMS_TEMPLATE_CODE,
  },

  // 内部服务通信
  aiClient: {
    baseUrl: AI_URL,
    token: INTERNAL_TOKEN,
  },

  // 业务
  credits: {
    registerBonus: 50,
  },

  // 中转服务（可选）
  ...(RELAY_SERVER_URL && {
    relay: {
      serverUrl: RELAY_SERVER_URL,
      apiKey: RELAY_API_KEY,
      callbackUrl: RELAY_CALLBACK_URL,
    },
  }),
}
