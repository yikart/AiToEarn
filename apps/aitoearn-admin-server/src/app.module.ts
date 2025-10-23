import { Module } from '@nestjs/common'
import { RedisModule } from '@yikart/redis'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { config } from './config'
import { CoreModule } from './core/core.module'
import { NatsModule } from './transports/nats.module'

@Module({
  imports: [
    NatsModule,
    RedisModule.register(config.redis),
    CoreModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule { }
