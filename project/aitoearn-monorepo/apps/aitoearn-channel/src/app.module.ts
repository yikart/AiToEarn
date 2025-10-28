import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { AitoearnServerClientModule } from '@yikart/aitoearn-server-client'
import { RedisModule } from '@yikart/redis'
import { Redis } from 'ioredis'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { config } from './config'
import { CoreModule } from './core/core.module'
import { DbMongoModule } from './libs/database'

@Module({
  imports: [
    AitoearnServerClientModule.forRoot(config.server),
    EventEmitterModule.forRoot(),
    DbMongoModule,
    CoreModule,
    ScheduleModule.forRoot(),
    RedisModule.forRoot(config.redis),
    BullModule.forRootAsync({
      useFactory: (redis: Redis) => {
        return {
          prefix: '{bull}',
          connection: redis,
        }
      },
      inject: [Redis],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
