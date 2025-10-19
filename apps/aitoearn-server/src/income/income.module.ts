import { Module } from '@nestjs/common'
import { IncomeController } from './income.controller'
import { IncomeService } from './income.service'

@Module({
  imports: [],
  controllers: [IncomeController],
  providers: [IncomeService],
})
export class IncomeModule {}
