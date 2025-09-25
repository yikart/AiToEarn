import { Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { config } from './config'
import { AppConfigModule } from './core/app-config/app-config.module'
import { FeedbackModule } from './core/feedback/feedback.module'
import { NotificationModule } from './core/notification/notification.module'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    AppConfigModule,
    FeedbackModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
