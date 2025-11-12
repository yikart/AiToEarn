import type { DynamicModule } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { RedisModule } from '@yikart/redis'
import { Redis } from 'ioredis'
import { QueueName } from './enums'
import { QueueConfig } from './queue.config'
import { QueueService } from './queue.service'

/**
 * 队列模块
 * 提供统一的队列管理功能
 */
@Module({})
export class AitoearnQueueModule {
  /**
   * 创建队列模块
   * @param config 队列配置
   */
  static forRoot(config: QueueConfig): DynamicModule {
    // 动态注册所有队列
    const queueModules = Object.values(QueueName).map((name) => {
      // 可以在这里为特殊队列添加特殊配置
      // if (name === QueueName.SomeSpecialQueue) {
      //   return BullModule.registerQueue({
      //     name,
      //     limiter: { duration: 10000, max: 100 },
      //   })
      // }
      return BullModule.registerQueue({ name })
    })

    return {
      global: true,
      module: AitoearnQueueModule,
      imports: [
        // 集成 Redis 模块
        RedisModule.forRoot(config.redis),
        // 配置 Bull 连接
        BullModule.forRootAsync({
          useFactory: (redis: Redis) => ({
            prefix: config.prefix,
            connection: redis,
          }),
          inject: [Redis],
        }),
        // 注册所有队列
        ...queueModules,
      ],
      providers: [
        {
          provide: QueueConfig,
          useValue: config,
        },
        QueueService,
      ],
      exports: [QueueService],
    }
  }
}
