import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { AiModule } from '../ai/ai.module'
import { ChatModule } from '../ai/core/chat'
import { CloudSpaceModule } from '../cloud/core/cloud-space'
import { ContentModule } from '../content/content.module'
import { IncomeModule } from '../income/income.module'
import { NotificationModule } from '../notification/notification.module'
import { PublishModule } from '../publishRecord/publishRecord.module'
import { UserModule } from '../user/user.module'
import { AccountController } from './account.controller'
import { AiController } from './ai.controller'
import { CloudSpaceController } from './cloud-space.controller'
import { IncomeInternalController } from './income.controller'
import { MaterialInternalController } from './material.controller'
import { NotificationInternalController } from './notification.controller'
import { AccountInternalService } from './provider/account.service'
import { PublishingInternalService } from './provider/publishing.service'
import { PublishingController } from './publishing.controller'
import { UserInternalController } from './user.controller'

@Module({
  imports: [
    UserModule,
    AccountModule,
    CloudSpaceModule,
    ChatModule,
    PublishModule,
    IncomeModule,
    NotificationModule,
    ContentModule,
    AiModule,
  ],
  providers: [AccountInternalService, PublishingInternalService],
  controllers: [
    UserInternalController,
    AccountController,
    AiController,
    CloudSpaceController,
    IncomeInternalController,
    NotificationInternalController,
    PublishingController,
    MaterialInternalController,
  ],
})
export class InternalModule {}
