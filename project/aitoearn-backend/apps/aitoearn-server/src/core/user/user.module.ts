import { Global, Module } from '@nestjs/common'
import { LoginController } from './login.controller'
import { LoginService } from './login.service'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Global()
@Module({
  imports: [],
  controllers: [UserController, LoginController],
  providers: [UserService, LoginService],
  exports: [UserService],
})
export class UserModule { }
