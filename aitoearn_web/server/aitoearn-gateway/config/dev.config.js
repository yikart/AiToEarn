const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
} = process.env

const {
  NATS_HOST,
  NATS_PORT,
  NATS_USERNAME,
  NATS_PASSWORD,
} = process.env

const { 
  MONGODB_USERNAME,
  MONGODB_PASSWORD,
  CLOUDWATCH_ACCESS_KEY_ID,
  CLOUDWATCH_SECRET_ACCESS_KEY,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  MAIL_PASSWORD,
  AI_QWEN_KEY,
  JWT_SECRET
} = process.env

module.exports = {
  port: 7000,
  enableBadRequestDetails: true,
  docs: {
    enabled: true,
    path: '/api/docs',
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
    uri: `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@dev.x.ai:27017/aitoearn?authSource=admin&directConnection=true`,
    dbName: 'aitoearn',
  },
  nats: {
    name: 'aitoearn-gateway-dev',
    servers: [`nats://${NATS_USERNAME}:${NATS_PASSWORD}@${NATS_HOST}:${NATS_PORT}`],
    user: NATS_USERNAME,
    pass: NATS_PASSWORD,
    prefix: 'dev',
  },

  // 邮件配置
  mail: {
    transport: {
      host: 'smtp.x.cn',
      port: 587,
      secure: false,
      auth: {
        user: 'hello@x.ai',
        pass: MAIL_PASSWORD,
      },
    },
    defaults: {
      from: 'hello@x.ai',
    },
  },

  awsS3: {
    region: 'ap-southeast-1',
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    bucketName: 'x',
  },
  payment: {
    successfulCallback: 'https://dev.x.ai',
  },
  pinterest: {
    redirect_url: '/en/pinterest',
  },
  ai: {
    qwenKey: AI_QWEN_KEY,
  },

  // JWT 配置
  jwt: {
    secret: JWT_SECRET,
    expiresIn: '30d',
  },

  tms: {

  },

  // 环境配置
  environment: 'development',
  mailBackHost: 'https://x.ai',
  channelAuthBackUrl: 'https://x.ai/en/accounts',
}