import { Module } from '@nestjs/common'
import { AsyncSettlementService } from './settlement.service'

@Module({
  providers: [AsyncSettlementService],
  exports: [AsyncSettlementService],
})
export class SettlementModule {}
