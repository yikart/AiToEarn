import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { RedisModule } from '@yikart/redis'
import { TaskDbModule } from '@yikart/task-db'
import { Redis } from 'ioredis'
import { config } from './config'
import { CoreModule } from './core'
import { TransportsModule } from './transports/transports.module'

@Module({
  imports: [
    TaskDbModule.forRoot(config.taskDb),
    RedisModule.forRoot(config.redis),
    BullModule.forRootAsync({
      useFactory: (redis: Redis) => {
        return {
          connection: redis,
        }
      },
      inject: [Redis],
    }),
    EventEmitterModule.forRoot(),
    TransportsModule,
    CoreModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
