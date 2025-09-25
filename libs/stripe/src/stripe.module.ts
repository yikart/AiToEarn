import { DynamicModule, Module } from '@nestjs/common'
import { Stripe } from 'stripe'
import { ChargeService } from './charge/charge.service'
import { CheckoutService } from './checkout/checkout.service'
import { CouponService } from './coupon/coupon.service'
import { PriceService } from './price/price.service'
import { ProductService } from './product/product.service'
import { RefundService } from './refund/refund.service'
import { StripeConfig } from './stripe.config'
import { SubscriptionService } from './subscription/subscription.service'

@Module({})
export class StripeModule {
  static forRoot(config: StripeConfig): DynamicModule {
    const exports = [
      ChargeService,
      CheckoutService,
      CouponService,
      PriceService,
      ProductService,
      RefundService,
      SubscriptionService,
    ]
    return {
      module: StripeModule,
      global: true,
      providers: [
        {
          provide: StripeConfig,
          useValue: config,
        },
        {
          provide: Stripe,
          useValue: new Stripe(config.sk),
        },
        ...exports,
      ],
      exports,
    }
  }
}
