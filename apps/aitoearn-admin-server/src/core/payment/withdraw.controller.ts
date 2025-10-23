import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import { WithdrawListFilterDto, WithdrawReleaseDto } from './dto/withdraw.dto'
import { WithdrawService } from './withdraw.service'

@ApiTags('withdraw - 提现')
@Controller('withdraw')
export class WithdrawController {
  constructor(
    private readonly withdrawService: WithdrawService,
  ) {}

  @ApiOperation({ summary: '提现发放' })
  @Post('release/:id')
  async release(@Param('id') id: string, @Body() body: WithdrawReleaseDto) {
    return this.withdrawService.release(id, body)
  }

  @ApiOperation({ summary: '列表' })
  @Get('list/:pageNo/:pageSize')
  async getList(
    @Param() param: TableDto,
    @Query() query: WithdrawListFilterDto,
  ) {
    return this.withdrawService.getList(param, query)
  }
}
