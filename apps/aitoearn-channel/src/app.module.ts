import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { config } from './config'
import { CoreModule } from './core/core.module'
import { DbMongoModule } from './libs/database'
import { RedisModule } from './libs/redis'
import { TransportModule } from './transports/transport.module'

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    RedisModule,
    DbMongoModule,
    CoreModule,
    TransportModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => {
        return config.bullmq
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
