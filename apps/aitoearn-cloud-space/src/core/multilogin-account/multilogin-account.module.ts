import { Module } from '@nestjs/common'
import { MultiloginAccountController } from './multilogin-account.controller'
import { MultiloginAccountService } from './multilogin-account.service'

@Module({
  controllers: [MultiloginAccountController],
  providers: [MultiloginAccountService],
  exports: [MultiloginAccountService],
})
export class MultiloginAccountModule {}
