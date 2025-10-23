import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserWalletAccountController } from './userWalletAccount.controller'
import { UserWalletAccountService } from './userWalletAccount.service'

@Module({
  imports: [
  ],
  controllers: [UserController, UserWalletAccountController],
  providers: [UserService, UserWalletAccountService],
  exports: [UserService, UserWalletAccountService],
})
export class UserModule { }
