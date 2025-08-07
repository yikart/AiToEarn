import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe'
import { RedisModule } from '@libs/redis'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ResponseInterceptor, ZodSerializerInterceptor } from './common'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { config } from './config'
import { CoreModule } from './core/core.module'

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    RedisModule,
    CoreModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useValue: new GlobalExceptionFilter({
        returnBadRequestDetails: config.enableBadRequestDetails,
      }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
