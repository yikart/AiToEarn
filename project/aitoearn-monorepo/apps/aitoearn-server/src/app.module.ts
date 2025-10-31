import path from 'node:path'
import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { AitoearnAuthModule } from '@yikart/aitoearn-auth'
import { AitoearnQueueModule } from '@yikart/aitoearn-queue'
import { MailModule } from '@yikart/mail'
import { MongodbModule } from '@yikart/mongodb'
import { AccountModule } from './account/account.module'
import { LogsModule } from './ai/core/logs'
import { AppConfigModule } from './app-configs/app-config.module'
import { AppReleaseModule } from './app-release/app-release.module'
import { ChannelModule } from './channel/channel.module'
import { config } from './config'
import { ContentModule } from './content/content.module'
import { FeedbackModule } from './feedback/feedback.module'
import { FileModule } from './file/file.module'
import { IncomeModule } from './income/income.module'
import { InternalModule } from './internal/internal.module'
import { ManagerModule } from './manager/manager.module'
import { NotificationModule } from './notification/notification.module'
import { PublishModule } from './publishRecord/publishRecord.module'
import { StatisticsModule } from './statistics/statistics.module'
import { TaskModule } from './task/task.module'
import { TransportsModule } from './transports/transports.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    MongodbModule.forRoot(config.mongodb),
    AitoearnQueueModule.forRoot({
      redis: config.redis,
      prefix: '{bull}',
    }),
    MailModule.forRoot({
      ...config.mail,
      template: {
        dir: path.join(__dirname, 'views'),
      },
    }),
    AitoearnAuthModule.forRoot(config.auth),
    FileModule,
    LogsModule,
    TransportsModule,
    AppConfigModule,
    FeedbackModule,
    NotificationModule,
    AppReleaseModule,
    AccountModule,
    UserModule,
    ContentModule,
    ChannelModule,
    TaskModule,
    IncomeModule,
    StatisticsModule,
    PublishModule,
    InternalModule,
    ManagerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
