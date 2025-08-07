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

// 添加 AWS 凭证环境变量
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

// 添加邮件认证环境变量
const { MAIL_USER, MAIL_PASS } = process.env;

// 添加 Qwen API 密钥环境变量
const { QWEN_API_KEY } = process.env;

// 添加 JWT 密钥环境变量
const { JWT_SECRET } = process.env;

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
    uri: `mongodb://root:yikart%402025@dev.aitoearn.ai:27017/aitoearn?authSource=admin&directConnection=true`,
    dbName: 'aitoearn',
  },
  nats: {
    name: 'aitoearn-gateway-dev',
    servers: [`nats://${NATS_USERNAME}:${NATS_PASSWORD}@${NATS_HOST}:${NATS_PORT}`],
    user: NATS_USERNAME,
    pass: NATS_PASSWORD,
    prefix: 'dev',
  },
  mail: {
    transport: {
      host: 'smtp.feishu.cn',
      port: 587,
      secure: false,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    },
    defaults: {
      from: 'hello@aiearn.ai',
    },
  },

  awsS3: {
    region: 'ap-southeast-1',
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    bucketName: 'aitoearn',
  },
  payment: {
    successfulCallback: 'https://dev.aitoearn.ai',
  },
  pinterest: {
    redirect_url: '/en/pinterest',
  },
  ai: {
    qwenKey: QWEN_API_KEY,
  },
  jwt: {
    secret: JWT_SECRET,
    expiresIn: '30d',
  },
  tms: {

  },
  environment: 'development',
  mailBackHost: 'https://dev.aitoearn.ai',
  channelAuthBackUrl: 'https://dev.aitoearn.ai/en/accounts',
}