import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AppException, ResponseCode, TableDto } from '@yikart/common'
import { IncomeStatus } from '@yikart/mongodb'
import { GetToken } from '../auth/auth.guard'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { UserWalletAccountService } from '../user/userWalletAccount.service'
import { IncomeFilterDto, WithdrawCreateAllDto, WithdrawCreateDto } from './dto/income.dto'
import { IncomeService } from './income.service'

@ApiTags('收入')
@Controller('income')
export class IncomeController {
  constructor(
    private readonly incomeService: IncomeService,
    private readonly userWalletAccountService: UserWalletAccountService,
  ) { }

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
    const incomeRecord = await this.incomeService.getInfo(body.incomeRecordId)
    if (!incomeRecord || incomeRecord.userId !== token.id) {
      throw new AppException(ResponseCode.IncomeRecordNotFound, 'Incom record not found')
    }
    if (incomeRecord.status !== IncomeStatus.WAIT) {
      throw new AppException(ResponseCode.IncomeRecordNotWithdrawable, 'Income record not withdrawable')
    }
    const userWalletAccount = await this.userWalletAccountService.info(body.userWalletAccountId)
    if (!userWalletAccount || userWalletAccount.userId !== token.id) {
      throw new AppException(ResponseCode.UserWalletAccountAlreadyExists, 'User wallet account not found')
    }
    return this.incomeService.withdraw(body.incomeRecordId, body.userWalletAccountId, body.flowId)
  }

  @ApiOperation({ summary: '提现全部收入' })
  @Post('withdrawAll')
  async withdrawAll(@GetToken() token: TokenInfo, @Body() body: WithdrawCreateAllDto) {
    const userWalletAccount = await this.userWalletAccountService.info(body.userWalletAccountId)
    if (!userWalletAccount || userWalletAccount.userId !== token.id) {
      throw new AppException(ResponseCode.UserWalletAccountAlreadyExists, 'User wallet account not found')
    }
    return this.incomeService.withdrawAll(token.id, body.userWalletAccountId)
  }
}
