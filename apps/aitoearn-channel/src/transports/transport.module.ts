import { Global, Module } from '@nestjs/common'
import { AccountInternalApi } from './account/account.api'
import { PublishingInternalApi } from './publishing/publishing.api'
import { TaskInternalApi } from './task/task.natsApi'

@Global()
@Module({
  imports: [],
  providers: [AccountInternalApi, PublishingInternalApi, TaskInternalApi],
  exports: [AccountInternalApi, PublishingInternalApi, TaskInternalApi],
})
export class TransportModule { }
