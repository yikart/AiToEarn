import { FingerprintService } from '@core/fingerprint/fingerprint.service'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Account, AccountGroup, AccountGroupSchema, AccountSchema } from '@/libs'
import { AccountController } from './account.controller'
import { AccountService } from './account.service'
import { AccountGroupController } from './accountGroup/accountGroup.controller'
import { AccountGroupService } from './accountGroup/accountGroup.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: AccountGroup.name, schema: AccountGroupSchema },
    ]),
  ],
  controllers: [AccountController, AccountGroupController],
  providers: [AccountService, AccountGroupService, FingerprintService],
})
export class AccountModule {}
