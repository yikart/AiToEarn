import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { RedisModule } from '@yikart/redis'
import { TaskDbModule } from '@yikart/task-db'
import { config } from './config'
import { CoreModule } from './core'
import { TransportsModule } from './transports/transports.module'

@Module({
  imports: [
    TaskDbModule.forRoot(config.taskDb),
    RedisModule.forRoot(config.redis),
    BullModule.forRoot({
      connection: config.bullmq.connection,
    }),
    EventEmitterModule.forRoot(),
    TransportsModule,
    CoreModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
