import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { AddIncomeSchemaDto, DeductIncomeDto } from '../income/dto/income.dto'
import { IncomeService } from '../income/income.service'

@ApiTags('内部服务接口')
@Controller('internal')
@Internal()
export class IncomeInternalController {
  constructor(private readonly incomeService: IncomeService) { }

  @ApiOperation({ summary: '增加收入' })
  @Post('income/add')
  async add(@Body() body: AddIncomeSchemaDto) {
    return this.incomeService.add(body)
  }

  @ApiOperation({ summary: '扣减收入' })
  @Post('income/deduct')
  async deduct(@Body() body: DeductIncomeDto) {
    return this.incomeService.deduct(body)
  }
}
