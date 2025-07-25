import { AppExceptionFilter } from '@common/filters/AppException.filter'
import { LoggerMiddleware } from '@common/middleware/log.middleware'
import { ZodValidationPipe } from '@common/pipes'
import { CoreModule } from '@core/core.module'
import { MailModule } from '@libs/mail/mail.module'
import { RedisModule } from '@libs/redis/redis.module'
import { MiddlewareConsumer, Module } from '@nestjs/common'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { NatsModule } from '@transports/nats.module'
import { AuthModule } from '@/auth/auth.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { config } from './config'

@Module({
  imports: [
    RedisModule.forRoot(config.redis),
    MailModule.forRoot(config.mail),
    NatsModule,
    CoreModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    AppService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
