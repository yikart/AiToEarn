import { Global, Module } from '@nestjs/common'
import { ChannelModule } from '../channel/channel.module'
import { FingerprintController } from '../fingerprint/fingerprint.controller'
import { FingerprintService } from '../fingerprint/fingerprint.service'
import { StatisticsModule } from '../statistics/statistics.module'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'
import { AccountGroupController } from './accountGroup.controller'
import { AccountGroupService } from './accountGroup.service'

@Global()
@Module({
  imports: [ChannelModule, StatisticsModule],
  providers: [FingerprintService, AccountService, AccountGroupService],
  controllers: [AccountController, AccountGroupController, FingerprintController],
  exports: [AccountService, AccountGroupService],
})
export class AccountModule { }
