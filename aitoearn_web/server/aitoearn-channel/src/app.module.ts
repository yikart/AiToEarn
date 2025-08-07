import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe'
import { DbMongoModule } from '@libs/database'
import { RedisModule } from '@libs/redis'
import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { LoggerModule } from 'nestjs-pino'
import { ScheduleModule } from '@nestjs/schedule'
import { TransportTargetOptions } from 'pino'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ResponseInterceptor, ZodSerializerInterceptor } from './common'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { config } from './config'
import { CoreModule } from './core/core.module'
import { NatsModule } from './transports/nats.module'

const targets: TransportTargetOptions[] = []
if (config.logger.cloudWatch?.enable) {
  targets.push({
    target: '@alexlau811/pino-cloudwatch',
    options: {
      group: config.logger.cloudWatch.group,
      aws_region: config.logger.cloudWatch.region,
      aws_access_key_id: config.logger.cloudWatch.accessKeyId,
      aws_secret_access_key: config.logger.cloudWatch.secretAccessKey,
      stream: config.logger.cloudWatch.stream,
      prefix: config.logger.cloudWatch.prefix,
    },
  })
}

if (config.logger.console?.enable) {
  targets.push({
    target: 'pino-pretty',
    options: config.logger.console,
  })
}

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          targets,
        },
      },
    }),
    EventEmitterModule.forRoot(),
    RedisModule,
    DbMongoModule,
    CoreModule,
    NatsModule,
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
