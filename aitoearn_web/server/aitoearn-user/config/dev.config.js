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

module.exports = {
  port: 3001,
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
    dbName: 'aitoearn_dev',
  },
  nats: {
    name: 'aitoearn-user-dev',
    servers: [`nats://${NATS_USERNAME}:${NATS_PASSWORD}@${NATS_HOST}:${NATS_PORT}`],
    user: NATS_USERNAME,
    pass: NATS_PASSWORD,
    prefix: 'dev',
  },
}
