import { Module } from '@nestjs/common'
import { AccountModule } from './account/account.module'
import { AiModule } from './ai/ai.module'
import { AppReleaseModule } from './app-release/app-release.module'
import { CloudSpacesModule } from './cloud-spaces/cloud-spaces.module'
import { ContentModule } from './content/content.module'
import { FileModule } from './file/file.module'
import { ManagerModule } from './manager/manager.module'
import { OtherModule } from './other/other.module'
import { PaymentModule } from './payment/payment.module'
import { TaskModule } from './task/task.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    FileModule,
    UserModule,
    TaskModule,
    PaymentModule,
    ManagerModule,
    OtherModule,
    ContentModule,
    AiModule,
    AccountModule,
    CloudSpacesModule,
    AppReleaseModule,
  ],
  providers: [],
})
export class CoreModule {}
