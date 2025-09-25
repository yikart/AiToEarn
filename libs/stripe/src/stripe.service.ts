import { Injectable } from '@nestjs/common'
import { ChargeService } from './charge'
import { CheckoutService } from './checkout'
import { CouponService } from './coupon'
import { PriceService } from './price'
import { ProductService } from './product'
import { RefundService } from './refund'
import { SubscriptionService } from './subscription'

@Injectable()
export class StripeService {
  constructor(
    private readonly chargeService: ChargeService,
    private readonly checkoutService: CheckoutService,
    private readonly couponService: CouponService,
    private readonly priceService: PriceService,
    private readonly productService: ProductService,
    private readonly refundService: RefundService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  get charge() {
    return this.chargeService
  }

  get checkout() {
    return this.checkoutService
  }

  get coupon() {
    return this.couponService
  }

  get price() {
    return this.priceService
  }

  get product() {
    return this.productService
  }

  get refund() {
    return this.refundService
  }

  get subscription() {
    return this.subscriptionService
  }
}
