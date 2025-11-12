import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { AitoearnQueueModule } from '@yikart/aitoearn-queue'
import { AitoearnServerClientModule } from '@yikart/aitoearn-server-client'
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
    AitoearnQueueModule.forRoot({
      redis: config.redis,
      prefix: '{bull}',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
