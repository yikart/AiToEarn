import { DynamicModule, Module } from '@nestjs/common'
import { Stripe } from 'stripe'
import { ChargeService } from './charge'
import { CheckoutService } from './checkout'
import { CouponService } from './coupon'
import { PriceService } from './price'
import { ProductService } from './product'
import { RefundService } from './refund'
import { StripeConfig } from './stripe.config'
import { StripeService } from './stripe.service'
import { SubscriptionService } from './subscription'

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
      StripeService,
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
