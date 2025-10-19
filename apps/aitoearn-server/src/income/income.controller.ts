import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import { GetToken } from '../auth/auth.guard'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { IncomeFilterDto, WithdrawCreateAllDto, WithdrawCreateDto } from './dto/income.dto'
import { IncomeService } from './income.service'

@ApiTags('收入')
@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) { }

  @ApiOperation({
    description: '获取收入列表',
    summary: '获取收入列表',
  })
  @Get('list/:pageNo/:pageSize')
  async getList(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
    @Query() query: IncomeFilterDto,
  ) {
    const res = await this.incomeService.getList(param, {
      userId: token.id,
      ...query,
    })
    return res
  }

  @ApiOperation({
    description: '获取收入信息',
    summary: '获取收入信息',
  })
  @Get('info/:id')
  async getInfo(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
  ) {
    const res = await this.incomeService.getInfo(id)
    return res
  }

  @ApiOperation({ summary: '收入记录创建提现' })
  @Post('withdraw')
  async withdraw(@GetToken() token: TokenInfo, @Body() body: WithdrawCreateDto) {
    return this.incomeService.withdraw(body.incomeRecordId, body.userWalletAccountId, body.flowId)
  }

  @ApiOperation({ summary: '提现全部收入' })
  @Post('withdrawAll')
  async withdrawAll(@GetToken() token: TokenInfo, @Body() body: WithdrawCreateAllDto) {
    return this.incomeService.withdrawAll(token.id, body.userWalletAccountId)
  }
}
