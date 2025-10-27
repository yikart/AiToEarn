import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { TableDto } from '@yikart/common'
import { WithdrawService } from './withdraw.service'

@ApiTags('withdraw - 提现')
@Controller('withdraw')
export class WithdrawController {
  constructor(
    private readonly withdrawService: WithdrawService,
  ) {}

  @ApiOperation({ summary: '信息' })
  @Get('info/:id')
  async getById(@GetToken() token: TokenInfo, @Param('id') id: string) {
    return this.withdrawService.getInfo(id)
  }

  @ApiOperation({ summary: '列表' })
  @Get('list/:pageNo/:pageSize')
  async subscription(
    @GetToken() token: TokenInfo,
    @Param() param: TableDto,
  ) {
    return this.withdrawService.getList(param, { userId: token.id })
  }
}
