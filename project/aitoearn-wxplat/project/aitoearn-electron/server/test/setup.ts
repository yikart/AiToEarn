import { RedisContainer } from '@testcontainers/redis';
import { MongoDBContainer } from '@testcontainers/mongodb';
import { initApp } from './app';

export default async () => {
  const redisContainer = await new RedisContainer().start();
  const mongoDBContainer = await new MongoDBContainer().start();

  global.mongo = mongoDBContainer;
  global.redis = redisContainer;

  process.env.MONGO_URI = `${mongoDBContainer.getConnectionString()}/test?directConnection=true`;
  process.env.MONGO_DB = 'test';

  console.info(mongoDBContainer.getConnectionString());

  process.env.REDIS_HOST = redisContainer.getHost();
  process.env.REDIS_PORT = redisContainer.getPort().toString();
  process.env.REDIS_PASSWORD = redisContainer.getPassword();

  await initApp();
};
