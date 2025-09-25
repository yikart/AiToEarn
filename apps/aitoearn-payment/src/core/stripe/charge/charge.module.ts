import { ChargeApiModule } from '@libs/stripe/charge/chargeApi.module'
import { Module } from '@nestjs/common'
import { ChargeController } from './charge.controller'
import { ChargeService } from './charge.service'

@Module({
  imports: [
    ChargeApiModule,
  ],
  controllers: [ChargeController],
  providers: [ChargeService],
})
export class ChargeModule {}
