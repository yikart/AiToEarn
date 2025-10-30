import { Module } from '@nestjs/common'
import { IncomeController } from './income.controller'
import { IncomeInternalController } from './income.internal.controller'
import { IncomeService } from './income.service'
import { WithdrawController } from './withdraw.controller'
import { WithdrawService } from './withdraw.service'

@Module({
  imports: [],
  controllers: [IncomeController, WithdrawController, IncomeInternalController],
  providers: [IncomeService, WithdrawService],
})
export class IncomeModule {}
