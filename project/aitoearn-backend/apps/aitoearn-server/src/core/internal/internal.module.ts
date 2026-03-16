import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { ContentModule } from '../content/content.module'
import { CreditsModule } from '../credits/credits.module'
import { NotificationModule } from '../notification/notification.module'
import { PublishModule } from '../publish-record/publish-record.module'
import { ShortLinkModule } from '../short-link/short-link.module'
import { UserModule } from '../user/user.module'
import { AccountController } from './account.controller'
import { MaterialInternalController } from './material.controller'
import { NotificationInternalController } from './notification.controller'
import { AccountInternalService } from './provider/account.service'
import { PublishingInternalService } from './provider/publishing.service'
import { PublishRecordController } from './publish-record.controller'
import { PublishingController } from './publishing.controller'
import { ShortLinkController } from './short-link.controller'
import { UserInternalController } from './user.controller'

@Module({
  imports: [
    UserModule,
    AccountModule,
    PublishModule,
    NotificationModule,
    ContentModule,
    CreditsModule,
    ShortLinkModule,
  ],
  providers: [AccountInternalService, PublishingInternalService],
  controllers: [
    UserInternalController,
    AccountController,
    NotificationInternalController,
    PublishingController,
    MaterialInternalController,
    PublishRecordController,
    ShortLinkController,
  ],
})
export class InternalModule {}
