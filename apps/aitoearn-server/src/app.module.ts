import { Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { AccountModule } from './account/account.module'
import { config } from './config'
import { AppConfigModule } from './core/app-config/app-config.module'
import { AppReleaseModule } from './core/app-release/app-release.module'
import { FeedbackModule } from './core/feedback/feedback.module'
import { NotificationModule } from './core/notification/notification.module'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    AppConfigModule,
    FeedbackModule,
    NotificationModule,
    AppReleaseModule,
    AccountModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
