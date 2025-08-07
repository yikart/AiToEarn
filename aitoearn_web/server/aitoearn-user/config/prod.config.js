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

// 添加 MongoDB 认证信息环境变量
const {
  MONGODB_USERNAME,
  MONGODB_PASSWORD
} = process.env
// 添加 AWS 凭证环境变量
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
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
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      group: 'aitoearn-apps',
      prefix: 'prod',
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
    // 使用环境变量替换硬编码的 MongoDB 认证信息
    uri: `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@dev.aitoearn.ai:27017/aitoearn?authSource=admin&directConnection=true`,
    dbName: 'aitoearn',
  },
  nats: {
    name: 'aitoearn-user-dev',
    servers: [`nats://${NATS_USERNAME}:${NATS_PASSWORD}@${NATS_HOST}:${NATS_PORT}`],
    user: NATS_USERNAME,
    pass: NATS_PASSWORD,
    prefix: 'prod',
  },
}