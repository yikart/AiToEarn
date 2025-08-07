import * as path from 'node:path'
import { AppExceptionFilter } from '@common/filters/AppException.filter'
import { LoggerMiddleware } from '@common/middleware/log.middleware'
import { ZodValidationPipe } from '@common/pipes'
import { CoreModule } from '@core/core.module'
import { MailModule } from '@libs/mail/mail.module'
import { RedisModule } from '@libs/redis/redis.module'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { MiddlewareConsumer, Module } from '@nestjs/common'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { NatsModule } from '@transports/nats.module'
import { LoggerModule } from 'nestjs-pino'
import { TransportTargetOptions } from 'pino'
import { AuthModule } from '@/auth/auth.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { config } from './config'

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
    RedisModule.forRoot(config.redis),
    MailModule.forRoot({
      template: {
        dir: path.join(__dirname, 'views'),
        // adapter: new EjsAdapter(),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
      ...config.mail,
    }),
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
