import { User, UserSchema, UserWallet, UserWalletSchema } from '@libs/database/schema'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AdminUserController } from './adminUser.controller'
import { AdminUserService } from './adminUser.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserPopController } from './userPop.controller'
import { VipController } from './vip.controller'
import { VipService } from './vip.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserWallet.name, schema: UserWalletSchema },
    ]),
  ],
  controllers: [UserController, UserPopController, VipController, AdminUserController],
  providers: [UserService, VipService, AdminUserService],
})
export class UserModule { }
