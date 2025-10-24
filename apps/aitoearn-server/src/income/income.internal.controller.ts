import {
  Body,
  Controller,
  Post,
} from '@nestjs/common'
import { AddIncomeSchemaDto, DeductIncomeDto } from './dto/income.dto'
import { IncomeService } from './income.service'

@Controller()
export class IncomeInternalController {
  constructor(private readonly incomeService: IncomeService) { }

  @Post('incomeInternal/income/add')
  async add(@Body() body: AddIncomeSchemaDto) {
    return this.incomeService.add(body)
  }

  @Post('incomeInternal/income/add')
  async deduct(@Body() body: DeductIncomeDto) {
    return this.incomeService.deduct(body)
  }
}
