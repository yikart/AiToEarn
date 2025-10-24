import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
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
import { NotificationModule } from './notification/notification.module'
import { PaymentModule } from './payment/payment.module'
import { StatisticsModule } from './statistics/statistics.module'
import { TaskModule } from './task/task.module'
import { ToolsModule } from './tools/tools.module'
import { TransportsModule } from './transports/transports.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    RedisModule.forRoot(config.redis),
    MailModule.forRoot(config.mail),
    BullModule.forRootAsync({
      useFactory: (redis: Redis) => {
        return {
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
