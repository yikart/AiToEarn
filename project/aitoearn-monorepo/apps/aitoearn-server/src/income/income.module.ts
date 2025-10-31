import { Module } from '@nestjs/common'
import { IncomeController } from './income.controller'
import { IncomeService } from './income.service'
import { WithdrawController } from './withdraw.controller'
import { WithdrawService } from './withdraw.service'

@Module({
  imports: [],
  controllers: [IncomeController, WithdrawController],
  providers: [IncomeService, WithdrawService],
  exports: [IncomeService],
})
export class IncomeModule {}
