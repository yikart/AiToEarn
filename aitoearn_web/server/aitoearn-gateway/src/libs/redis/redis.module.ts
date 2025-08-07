import { DynamicModule, Global, Module } from '@nestjs/common'
import Redis from 'ioredis'
import { RedisConfig } from './redis.config'
import { REDIS_CLIENT } from './redis.constant'
import { RedisService } from './redis.service'

@Global()
@Module({})
export class RedisModule {
  static forRoot(config: RedisConfig): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        { provide: RedisConfig, useValue: config },
        RedisService,
        {
          provide: REDIS_CLIENT,
          useFactory: (redisConfig: RedisConfig) => {
            const client = new Redis(redisConfig)
            client.on('error', (err) => {
              console.error('Redis client encountered an error:', err)
            })

            client.on('end', () => {
              console.log('Connection to Redis closed.')
            })

            return client
          },
          inject: [RedisConfig],
        },
      ],
      exports: [REDIS_CLIENT, RedisService],
    }
  }
}
