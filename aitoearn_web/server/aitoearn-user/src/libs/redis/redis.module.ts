/*
 * @Author: nevin
 * @Date: 2024-08-30 14:39:05
 * @LastEditTime: 2024-09-14 19:03:21
 * @LastEditors: nevin
 * @Description:
 */
import { Global, Logger, Module } from '@nestjs/common'
import Redis from 'ioredis'
import { config } from '@/config'
import { REDIS_CLIENT } from './redis.constant'
import { RedisService } from './redis.service'

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const logger = new Logger('RedisModule')
        const client = new Redis(config.redis)
        client.on('error', (err) => {
          logger.error('Redis client encountered an error:', err)
        })

        client.on('end', () => {
          logger.log('Connection to Redis closed.')
        })

        return client
      },
    },
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule { }
