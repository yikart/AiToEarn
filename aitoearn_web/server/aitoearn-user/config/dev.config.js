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
  CLOUDWATCH_SECRET_ACCESS_KEY 
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
      group: 'x-apps',
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
    uri: `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@dev.x.ai:27017/x?authSource=admin&directConnection=true`,
    dbName: 'x',
  },
  nats: {
    name: 'x-user-dev',
    servers: [`nats://${NATS_USERNAME}:${NATS_PASSWORD}@${NATS_HOST}:${NATS_PORT}`],
    user: NATS_USERNAME,
    pass: NATS_PASSWORD,
    prefix: 'dev',
  },
}