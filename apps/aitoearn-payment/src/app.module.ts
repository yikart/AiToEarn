import { Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { StripeModule } from '@yikart/stripe'
import { config } from './config'
import { AdminModule } from './core/admin/admin.module'
import { ChargeModule } from './core/stripe/charge/charge.module'
import { CheckoutModule } from './core/stripe/checkout/checkout.module'
import { CouponModule } from './core/stripe/coupon/coupon.module'
import { PriceModule } from './core/stripe/price/price.module'
import { ProductModule } from './core/stripe/product/product.module'
import { RefundModule } from './core/stripe/refund/refund.module'
import { SubscriptionModule } from './core/stripe/subscription/subscription.module'
import { WebhookModule } from './core/stripe/webhook/webhook.module'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    StripeModule.forRoot(config.stripe),
    AdminModule,
    CheckoutModule,
    PriceModule,
    ProductModule,
    RefundModule,
    ChargeModule,
    WebhookModule,
    SubscriptionModule,
    CouponModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
