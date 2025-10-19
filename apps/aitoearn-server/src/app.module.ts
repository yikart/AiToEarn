import { Module } from '@nestjs/common'
import { MailModule } from '@yikart/mail'
import { MongodbModule } from '@yikart/mongodb'
import { RedisModule } from '@yikart/redis'
import { AccountModule } from './account/account.module'
import { AppConfigModule } from './app-configs/app-config.module'
import { AppReleaseModule } from './app-release/app-release.module'
import { AuthModule } from './auth/auth.module'
import { config } from './config'
import { ContentModule } from './content/content.module'
import { FeedbackModule } from './core/feedback/feedback.module'
import { NotificationModule } from './notification/notification.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    RedisModule.register(config.redis),
    MailModule.forRoot(config.mail),
    AuthModule,
    AppConfigModule,
    FeedbackModule,
    NotificationModule,
    AppReleaseModule,
    AccountModule,
    UserModule,
    ContentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
