import { Module } from '@nestjs/common'
import { ChargeController } from './charge.controller'
import { ChargeService } from './charge.service'

@Module({
  imports: [
  ],
  controllers: [ChargeController],
  providers: [ChargeService],
})
export class ChargeModule {}
