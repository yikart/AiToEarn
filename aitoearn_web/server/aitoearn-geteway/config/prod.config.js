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
  MAIL_HOST,
  MAIL_PORT,
  MAIL_AUTH_USER,
  MAIL_AUTH_PASS,
} = process.env

const {
  OSS_KEY_ID,
  OSS_KEY_SECRET,
  OSS_BUCKET,
  OSS_REGION,
  OSS_ENDPOINT,
} = process.env

const {
  JWT_SECRET,
  MAIL_BACK_URL,
} = process.env

module.exports = {
  port: 7000,
  enableBadRequestDetails: true,
  docs: {
    enabled: true,
    path: '/api/docs',
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
    dbName: 'aitoearn_prod',
  },
  nats: {
    name: 'aitoearn-gateway-prod',
    servers: [`nats://${NATS_USERNAME}:${NATS_PASSWORD}@${NATS_HOST}:${NATS_PORT}`],
    user: NATS_USERNAME,
    pass: NATS_PASSWORD,
    prefix: 'prod',
  },

  mail: {
    transport: {
      host: MAIL_HOST,
      port: MAIL_PORT,
      secure: false,
      auth: {
        user: MAIL_AUTH_USER,
        pass: MAIL_AUTH_PASS,
      },
    },
    defaults: {
      from: 'hello@aiearn.ai',
    },
  },

  aliOss: {
    accessKeyId: OSS_KEY_ID,
    accessKeySecret: OSS_KEY_SECRET,
    bucket: OSS_BUCKET,
    region: OSS_REGION,
    endpoint: OSS_ENDPOINT,
    internal: false,
    secure: true,
    timeout: 60000,
    cname: false,
    isRequestPay: false,
  },

  // JWT 配置
  jwt: {
    secret: JWT_SECRET,
    expiresIn: '30d',
  },

  tms: {
  },

  // 环境配置
  environment: 'prod',
  mailBackUrl: MAIL_BACK_URL,
}
