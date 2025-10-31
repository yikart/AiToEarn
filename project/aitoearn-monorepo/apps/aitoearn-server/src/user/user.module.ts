import { Global, Module } from '@nestjs/common'
import { LoginController } from './login.controller'
import { PointsService } from './points.service'
import { StorageService } from './storage.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserPopController } from './userPop.controller'
import { UserWalletAccountController } from './userWalletAccount.controller'
import { UserWalletAccountService } from './userWalletAccount.service'
import { VipController } from './vip.controller'
import { VipService } from './vip.service'

@Global()
@Module({
  controllers: [UserController, LoginController, UserPopController, UserWalletAccountController, VipController],
  providers: [UserService, UserWalletAccountService, PointsService, VipService, StorageService],
  exports: [UserService, VipService, StorageService, PointsService, UserWalletAccountService],
})
export class UserModule { }
