import type { DynamicModule } from '@nestjs/common'
import Redis from 'ioredis'

import { RedisConfig } from './redis.config'
import { RedisService } from './redis.service'

export class RedisModule {
  static register(config: RedisConfig): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: RedisConfig,
          useValue: config,
        },
        {
          provide: Redis,
          useFactory: (redisConfig: RedisConfig) => {
            return new Redis(redisConfig)
          },
          inject: [RedisConfig],
        },
        RedisService,
      ],
      exports: [RedisService],
      global: true,
    }
  }
}
