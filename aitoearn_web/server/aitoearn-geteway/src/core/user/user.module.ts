import { Module } from '@nestjs/common'
import { LoginController } from './login.controller'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserPopController } from './userPop.controller'

@Module({
  imports: [],
  controllers: [UserController, LoginController, UserPopController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
