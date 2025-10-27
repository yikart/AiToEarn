/*
 * @Author: nevin
 * @Date: 2022-01-20 11:05:02
 * @LastEditors: nevin
 * @LastEditTime: 2025-01-13 17:26:58
 * @Description: 队列配置
 */
export default () => ({
  BULLMQ_REDIS_CONFIG: {
    HOST: process.env.REDIS_HOST || '127.0.0.1',
    PORT: Number(process.env.REDIS_PORT) || 6379,
    PASSWORD: process.env.REDIS_PASSWORD || '',
    DB: process.env.REDIS_DB,
  },
});
