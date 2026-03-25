import path from 'node:path'
import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { AitoearnAiClientModule } from '@yikart/aitoearn-ai-client'
import { AitoearnAuthModule } from '@yikart/aitoearn-auth'
import { AitoearnQueueModule } from '@yikart/aitoearn-queue'
import { AliSmsModule } from '@yikart/ali-sms'
import { ChannelDbModule } from '@yikart/channel-db'
import { MailModule } from '@yikart/mail'
import { MongodbModule } from '@yikart/mongodb'
import { RedlockModule } from '@yikart/redlock'
import { config } from './config'
import { AccountModule } from './core/account/account.module'
import { ApiKeyModule } from './core/api-key/api-key.module'
import { AssetsModule } from './core/assets/assets.module'
import { ChannelModule } from './core/channel/channel.module'
import { ContentModule } from './core/content/content.module'
import { CreditsModule } from './core/credits/credits.module'
import { InternalModule } from './core/internal/internal.module'
import { NotificationModule } from './core/notification/notification.module'
import { PublishModule } from './core/publish-record/publish-record.module'
import { RelayModule } from './core/relay/relay.module'
import { ShortLinkModule } from './core/short-link/short-link.module'
import { ToolsModule } from './core/tools/tools.module'
import { UnifiedMcpModule } from './core/unified-mcp/unified-mcp.module'
import { UserModule } from './core/user/user.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    MongodbModule.forRoot(config.mongodb),
    ChannelDbModule.forRoot(config.channel.channelDb),
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
    RedlockModule.forRoot(config.redlock),
    AitoearnAiClientModule.forRoot(config.aiClient),
    AliSmsModule.forRoot(config.aliSms),
    AssetsModule,
    NotificationModule,
    AccountModule,
    UserModule,
    CreditsModule,
    ContentModule,
    ChannelModule,
    PublishModule,
    InternalModule,
    ShortLinkModule,
    ToolsModule,
    ApiKeyModule,
    RelayModule,
    UnifiedMcpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
