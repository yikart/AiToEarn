import { Module } from '@nestjs/common'
import { CouponController } from './coupon.controller'
import { CouponService } from './coupon.service'

@Module({
  imports: [
  ],
  controllers: [CouponController],
  providers: [CouponService],
})
export class CouponModule {}
