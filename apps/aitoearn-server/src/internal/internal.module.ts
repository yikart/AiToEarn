import { Global, Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { PublishModule } from '../publishRecord/publishRecord.module'
import { PublishRecordService } from '../publishRecord/publishRecord.service'
import { AccountController } from './account.controller'
import { AccountInternalService } from './provider/account.service'
import { PublishingInternalService } from './provider/publishing.service'
import { PublishingController } from './publishing.controller'

@Global()
@Module({
  imports: [AccountModule, PublishModule],
  providers: [AccountInternalService, PublishingInternalService, PublishRecordService],
  controllers: [AccountController, PublishingController],
  exports: [AccountInternalService, PublishingInternalService, PublishRecordService],
})
export class InternalModule { }
