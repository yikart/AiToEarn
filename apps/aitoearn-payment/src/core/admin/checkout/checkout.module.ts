import { Module } from '@nestjs/common'
import { AdminCheckoutController } from './checkout.controller'
import { AdminCheckoutService } from './checkout.service'

@Module({
  imports: [
  ],
  controllers: [AdminCheckoutController],
  providers: [AdminCheckoutService],
})
export class AdminCheckoutModule {}
