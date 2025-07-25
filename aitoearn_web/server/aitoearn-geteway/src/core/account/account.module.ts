import { Global, Module } from '@nestjs/common'
import { AccountController } from './account.controller'
import { AccountGroupController } from './accountGroup/accountGroup.controller'

@Global()
@Module({
  imports: [],
  providers: [],
  controllers: [AccountController, AccountGroupController],
})
export class AccountModule {}
