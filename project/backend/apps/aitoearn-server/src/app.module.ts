import path from 'node:path'
import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { AitoearnAuthModule } from '@yikart/aitoearn-auth'
import { AitoearnQueueModule } from '@yikart/aitoearn-queue'
import { ListmonkModule } from '@yikart/listmonk'
import { MailModule } from '@yikart/mail'
import { MongodbModule } from '@yikart/mongodb'
import { AccountModule } from './account/account.module'
import { LogsModule } from './ai/logs'
import { AppConfigModule } from './app-configs/app-config.module'
import { ChannelModule } from './channel/channel.module'
import { config } from './config'
import { ContentModule } from './content/content.module'
import { FeedbackModule } from './feedback/feedback.module'
import { FileModule } from './file/file.module'
import { InternalModule } from './internal/internal.module'
import { NotificationModule } from './notification/notification.module'
import { PublishModule } from './publishRecord/publishRecord.module'
import { StatisticsModule } from './statistics/statistics.module'
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
    ListmonkModule.forRoot(config.listmonk),
    FileModule,
    LogsModule,
    TransportsModule,
    AppConfigModule,
    FeedbackModule,
    NotificationModule,
    AccountModule,
    UserModule,
    ContentModule,
    ChannelModule,
    StatisticsModule,
    PublishModule,
    InternalModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
