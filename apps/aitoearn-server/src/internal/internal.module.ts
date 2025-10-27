import { Global, Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { ChatModule, ChatService } from '../ai/core/chat'
import { PublishModule } from '../publishRecord/publishRecord.module'
import { PublishRecordService } from '../publishRecord/publishRecord.service'
import { AccountController } from './account.controller'
import { AIController } from './ai.controller'
import { AccountInternalService } from './provider/account.service'
import { PublishingInternalService } from './provider/publishing.service'
import { PublishingController } from './publishing.controller'

@Global()
@Module({
  providers: [AccountInternalService, PublishingInternalService, PublishRecordService, ChatService],
  imports: [AccountModule, PublishModule, ChatModule],
  controllers: [AccountController, PublishingController, AIController],
  exports: [AccountInternalService, PublishingInternalService, PublishRecordService],
})
export class InternalModule { }
