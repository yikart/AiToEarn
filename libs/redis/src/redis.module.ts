import type { DynamicModule } from '@nestjs/common'
import { Cluster, Redis } from 'ioredis'

import { RedisConfig } from './redis.config'
import { RedisService } from './redis.service'

export class RedisModule {
  static forRoot(config: RedisConfig): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: Redis,
          useFactory: () => {
            if ('nodes' in config) {
              return new Cluster(config.nodes, {
                ...config.options,
                dnsLookup: (address, callback) => callback(null, address),
              })
            }
            const tls = config.tls ? {} : undefined
            return new Redis({
              ...config,
              tls,
            })
          },
        },
        {
          provide: RedisService,
          useFactory: (client: Redis) => new RedisService(client),
          inject: [Redis],
        },
      ],
      exports: [RedisService, Redis],
      global: true,
    }
  }
}
