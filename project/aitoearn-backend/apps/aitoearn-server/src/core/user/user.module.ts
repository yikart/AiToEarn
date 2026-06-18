import { Global, Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Global()
@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
