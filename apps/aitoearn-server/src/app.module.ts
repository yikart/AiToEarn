import path from 'node:path'
import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { MailModule } from '@yikart/mail'
import { MongodbModule } from '@yikart/mongodb'
import { RedisModule } from '@yikart/redis'
import { Redis } from 'ioredis'
import { AccountModule } from './account/account.module'
import { LogsModule } from './ai/core/logs'
import { AppConfigModule } from './app-configs/app-config.module'
import { AppReleaseModule } from './app-release/app-release.module'
import { AuthModule } from './auth/auth.module'
import { ChannelModule } from './channel/channel.module'
import { config } from './config'
import { ContentModule } from './content/content.module'
import { FeedbackModule } from './feedback/feedback.module'
import { FileModule } from './file/file.module'
import { IncomeModule } from './income/income.module'
import { InternalModule } from './internal/internal.module'
import { NotificationModule } from './notification/notification.module'
import { PaymentModule } from './payment/payment.module'
import { PublishModule } from './publishRecord/publishRecord.module'
import { StatisticsModule } from './statistics/statistics.module'
import { TaskModule } from './task/task.module'
import { ToolsModule } from './tools/tools.module'
import { TransportsModule } from './transports/transports.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    MongodbModule.forRoot(config.mongodb),
    RedisModule.forRoot(config.redis),
    MailModule.forRoot({
      ...config.mail,
      template: {
        dir: path.join(__dirname, 'views'),
      },
    }),
    BullModule.forRootAsync({
      useFactory: (redis: Redis) => {
        return {
          prefix: '{bull}',
          connection: redis,
        }
      },
      inject: [Redis],
    }),
    FileModule,
    ToolsModule,
    LogsModule,
    TransportsModule,
    AuthModule,
    AppConfigModule,
    FeedbackModule,
    NotificationModule,
    AppReleaseModule,
    AccountModule,
    UserModule,
    ContentModule,
    ChannelModule,
    TaskModule,
    PaymentModule,
    IncomeModule,
    StatisticsModule,
    PublishModule,
    InternalModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
