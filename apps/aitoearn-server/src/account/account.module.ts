import { Global, Module } from '@nestjs/common'
import { ChannelModule } from '../channel/channel.module'
import { CloudSpaceModule } from '../cloud/core/cloud-space'
import { FingerprintController } from '../fingerprint/fingerprint.controller'
import { FingerprintService } from '../fingerprint/fingerprint.service'
import { StatisticsModule } from '../statistics/statistics.module'
import { TaskModule } from '../task/task.module'
import { AccountController } from './account.controller'
import { AccountInternalController } from './account.internal.controller'
import { AccountService } from './account.service'
import { AccountGroupController } from './accountGroup.controller'
import { AccountGroupService } from './accountGroup.service'

@Global()
@Module({
  imports: [CloudSpaceModule, TaskModule, ChannelModule, StatisticsModule],
  providers: [FingerprintService, AccountService, AccountGroupService],
  controllers: [AccountController, AccountGroupController, FingerprintController, AccountInternalController],
  exports: [AccountService, AccountGroupService],
})
export class AccountModule { }
