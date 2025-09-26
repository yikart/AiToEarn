import { Module } from '@nestjs/common'
import { WithdrawAdminController } from './admin/withdrawAdmin.controller'
import { WithdrawAdminService } from './admin/withdrawAdmin.service'
import { WithdrawController } from './withdraw.controller'
import { WithdrawService } from './withdraw.service'

@Module({
  imports: [
  ],
  controllers: [WithdrawController, WithdrawAdminController],
  providers: [WithdrawService, WithdrawAdminService],
})
export class WithdrawModule {}
