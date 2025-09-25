import { Module } from '@nestjs/common'
import { AdminCheckoutModule } from './checkout/checkout.module'
import { AdminProductModule } from './product/product.module'

@Module({
  imports: [AdminProductModule, AdminCheckoutModule],
})
export class AdminModule { }
