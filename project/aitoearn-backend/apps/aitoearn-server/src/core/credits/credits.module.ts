import { Global, Module } from '@nestjs/common'
import { HelpersModule } from '@yikart/helpers'
import { CreditsPurchaseConsumer } from './credits-purchase.consumer'
import { CreditsRefundConsumer } from './credits-refund.consumer'
import { CreditsController } from './credits.controller'
import { CreditsService } from './credits.service'

@Global()
@Module({
  imports: [
    HelpersModule,
  ],
  controllers: [CreditsController],
  providers: [CreditsService, CreditsPurchaseConsumer, CreditsRefundConsumer],
  exports: [CreditsService],
})
export class CreditsModule { }
