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
  JWT_SECRET,
} = process.env

const {
  APP_ENV,
  APP_NAME,
  NODE_ENV,
} = process.env

const {
  FEISHU_WEBHOOK_URL,
  FEISHU_WEBHOOK_SECRET,
} = process.env

const {
  INTERNAL_TOKEN,
} = process.env

module.exports = {
  port: 9527,
  environment: NODE_ENV,
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
  enableBadRequestDetails: true,
  redis: {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    db: 1,
  },
  redlock: {
    redis: {
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      db: 1,
    },
  },
  mongodb: {
    uri: `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}:${MONGODB_PORT}/?tls=true&tlsCAFile=global-bundle.pem&retryWrites=false`,
    dbName: 'aitoearn',
  },
  awsS3: {
    region: 'ap-southeast-1',
    bucketName: 'aitoearn',
    endpoint: 'https://aitoearn.s3.ap-southeast-1.amazonaws.com',
  },
  auth: {
    secret: JWT_SECRET,
    internalToken: INTERNAL_TOKEN,
  },
}
