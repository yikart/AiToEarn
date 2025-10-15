import { Global, Module } from '@nestjs/common'
import { ChannelModule } from '../channel/channel.module'
import { FingerprintController } from '../fingerprint/fingerprint.controller'
import { FingerprintService } from '../fingerprint/fingerprint.service'
import { TaskModule } from '../task/task.module'
import { AccountController } from './account.controller'
import { AccountGroupController } from './accountGroup.controller'

@Global()
@Module({
  imports: [TaskModule, ChannelModule],
  providers: [FingerprintService],
  controllers: [AccountController, AccountGroupController, FingerprintController],
})
export class AccountModule {}
