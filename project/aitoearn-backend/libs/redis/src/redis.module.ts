import type { DynamicModule } from '@nestjs/common'
import { Cluster, Redis } from 'ioredis'
import { EventStreamExplorer } from './event-stream.explorer'
import { EventStreamService } from './event-stream.service'
import { RedisPubSubService } from './pub-sub.service'
import { RedisConfig } from './redis.config'
import { RedisService } from './redis.service'

const REDIS_PUBSUB_SUBSCRIBER = Symbol('REDIS_PUBSUB_SUBSCRIBER')
const REDIS_PUBSUB_PUBLISHER = Symbol('REDIS_PUBSUB_PUBLISHER')

function createRedisClient(config: RedisConfig, options?: { enableReadyCheck?: boolean }) {
  if ('nodes' in config) {
    return new Cluster(config.nodes, {
      ...config.options,
      dnsLookup: (address, callback) => callback(null, address),
    })
  }
  const tls = config.tls ? {} : undefined
  return new Redis({
    ...config,
    maxRetriesPerRequest: null,
    tls,
    enableReadyCheck: options?.enableReadyCheck ?? true,
  })
}
export class RedisModule {
  static forRoot(config: RedisConfig): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: Redis,
          useFactory: () => createRedisClient(config),
        },
        {
          provide: REDIS_PUBSUB_SUBSCRIBER,
          useFactory: () => createRedisClient(config, { enableReadyCheck: false }),
        },
        {
          provide: REDIS_PUBSUB_PUBLISHER,
          useFactory: () => createRedisClient(config, { enableReadyCheck: false }),
        },
        {
          provide: RedisService,
          useFactory: (client: Redis) => new RedisService(client),
          inject: [Redis],
        },
        {
          provide: RedisPubSubService,
          useFactory: (subscriber: Redis, publisher: Redis) => new RedisPubSubService(subscriber, publisher),
          inject: [REDIS_PUBSUB_SUBSCRIBER, REDIS_PUBSUB_PUBLISHER],
        },
        {
          provide: EventStreamService,
          useFactory: (client: Redis) => new EventStreamService(client),
          inject: [Redis],
        },
        EventStreamExplorer,
      ],
      exports: [RedisService, RedisPubSubService, EventStreamService, Redis],
      global: true,
    }
  }
}
