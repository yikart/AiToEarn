import { Module } from '@nestjs/common'
import { AuthModule } from '../../common/auth/auth.module'
import { LoginController } from './login.controller'
import { ManagerService } from './manager.service'

@Module({
  imports: [AuthModule],
  controllers: [LoginController],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
