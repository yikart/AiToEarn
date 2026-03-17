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
import { AccountMcpModule } from './core/account/account-mcp.module'
import { AccountModule } from './core/account/account.module'
import { AssetsModule } from './core/assets/assets.module'
import { ChannelModule } from './core/channel/channel.module'
import { PublishMcpModule } from './core/channel/publish.mcp.module'
import { ContentMcpModule } from './core/content/content-mcp.module'
import { ContentModule } from './core/content/content.module'
import { CreditsModule } from './core/credits/credits.module'
import { InternalModule } from './core/internal/internal.module'
import { NotificationModule } from './core/notification/notification.module'
import { PublishModule } from './core/publish-record/publish-record.module'
import { ShortLinkModule } from './core/short-link/short-link.module'
import { ToolsModule } from './core/tools/tools.module'
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
    // MCP modules (after business modules to ensure @Global services are available)
    AccountMcpModule,
    PublishMcpModule,
    ContentMcpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
