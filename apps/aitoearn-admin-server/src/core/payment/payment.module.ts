import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { WithdrawController } from './withdraw.controller'
import { WithdrawService } from './withdraw.service'

@Module({
  controllers: [PaymentController, WithdrawController],
  providers: [PaymentService, WithdrawService],
})
export class PaymentModule {}
