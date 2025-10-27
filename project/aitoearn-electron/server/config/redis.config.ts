/*
 * @Author: nevin
 * @Date: 2022-01-20 11:05:02
 * @LastEditors: nevin
 * @LastEditTime: 2024-08-31 19:27:09
 * @Description: redis缓存配置文件
 */
import { RedisOptions } from 'ioredis';
export default (): { REDIS_CONFIG: RedisOptions } => ({
  REDIS_CONFIG: {
    name: 'default',
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: Number.parseInt(process.env.REDIS_DB) || 0,
    connectTimeout: 10000,
  },
});
