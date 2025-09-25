import { Module } from '@nestjs/common'
import { UserRepository } from '@yikart/mongodb'
import { NatsClientModule } from '@yikart/nats-client'
import { config } from '../../config'
import { AdminUserController } from './adminUser.controller'
import { AdminUserService } from './adminUser.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserPopController } from './userPop.controller'
import { VipController } from './vip.controller'
import { VipService } from './vip.service'

@Module({
  imports: [NatsClientModule.register(config.nats)],
  controllers: [UserController, UserPopController, VipController, AdminUserController],
  providers: [UserService, VipService, AdminUserService, UserRepository],
})
export class UserModule { }
