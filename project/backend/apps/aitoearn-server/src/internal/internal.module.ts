import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { AiModule } from '../ai/ai.module'
import { ChatModule } from '../ai/core/chat'
import { ModelsConfigModule } from '../ai/core/models-config'
import { ContentModule } from '../content/content.module'
import { NotificationModule } from '../notification/notification.module'
import { PublishModule } from '../publishRecord/publishRecord.module'
import { UserModule } from '../user/user.module'
import { AccountController } from './account.controller'
import { AiController } from './ai.controller'
import { MaterialInternalController } from './material.controller'
import { NotificationInternalController } from './notification.controller'
import { AccountInternalService } from './provider/account.service'
import { PublishingInternalService } from './provider/publishing.service'
import { PublishingController } from './publishing.controller'
import { PublishRecordController } from './publishRecord.controller'
import { UserInternalController } from './user.controller'

@Module({
  imports: [
    UserModule,
    AccountModule,
    ChatModule,
    PublishModule,
    NotificationModule,
    ContentModule,
    AiModule,
    ModelsConfigModule,
  ],
  providers: [AccountInternalService, PublishingInternalService],
  controllers: [
    UserInternalController,
    AccountController,
    AiController,
    NotificationInternalController,
    PublishingController,
    MaterialInternalController,
    PublishRecordController,
  ],
})
export class InternalModule {}
