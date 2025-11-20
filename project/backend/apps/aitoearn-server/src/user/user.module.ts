import { Global, Module } from '@nestjs/common'
import { LoginController } from './login.controller'
import { LoginService } from './login.service'
import { PointsService } from './points.service'
import { StorageService } from './storage.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserPopController } from './userPop.controller'
import { VipController } from './vip.controller'
import { VipService } from './vip.service'

@Global()
@Module({
  controllers: [UserController, LoginController, UserPopController, VipController],
  providers: [UserService, PointsService, VipService, StorageService, LoginService],
  exports: [UserService, VipService, StorageService, PointsService],
})
export class UserModule { }
