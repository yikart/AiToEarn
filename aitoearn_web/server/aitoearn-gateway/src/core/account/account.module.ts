import { FingerprintController } from '@core/account/fingerprint/fingerprint.controller'
import { FingerprintService } from '@core/account/fingerprint/fingerprint.service'
import { Global, Module } from '@nestjs/common'
import { AccountController } from './account.controller'
import { AccountGroupController } from './accountGroup/accountGroup.controller'

@Global()
@Module({
  imports: [],
  providers: [FingerprintService],
  controllers: [AccountController, AccountGroupController, FingerprintController],
})
export class AccountModule {}
