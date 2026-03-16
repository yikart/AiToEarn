import { Module } from '@nestjs/common'
import { FingerprintService } from '../fingerprint/fingerprint.service'
import { AccountGroupController } from './account-group.controller'
import { AccountGroupService } from './account-group.service'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'

@Module({
  providers: [FingerprintService, AccountService, AccountGroupService],
  controllers: [AccountController, AccountGroupController],
  exports: [AccountService, AccountGroupService],
})
export class AccountModule { }
