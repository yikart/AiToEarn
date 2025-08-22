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

// 新增环境变量定义
const {
  MONGODB_USERNAME,
  MONGODB_PASSWORD,
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_AUTH_SOURCE,
  CLOUDWATCH_ACCESS_KEY_ID,
  CLOUDWATCH_SECRET_ACCESS_KEY,
  GOLOGIN_TOKEN,
} = process.env

module.exports = {
  port: 3001,
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
    uri: `mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/aitoearn?authSource=${MONGODB_AUTH_SOURCE}&directConnection=true`,
    dbName: 'aitoearn',
  },
  nats: {
    name: 'aitoearn-other-dev',
    servers: [`nats://${NATS_USERNAME}:${NATS_PASSWORD}@${NATS_HOST}:${NATS_PORT}`],
    user: NATS_USERNAME,
    pass: NATS_PASSWORD,
    prefix: 'dev',
  },
  gologin: {
    token: GOLOGIN_TOKEN,
  },
}