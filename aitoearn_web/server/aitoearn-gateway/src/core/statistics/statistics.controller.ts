import {
  Controller,
  Get,
  Logger,
  Param,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken } from 'src/auth/auth.guard'
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces'
import { StatisticsNatsApi } from '@/transports/statistics/statistics.natsApi'
import {
  getPeriodDateDto,
} from './dto/statistics.dto'

import { StatisticsService } from './statistics.service'

@ApiTags('statistics - 数据统计')
@Controller('statistics')
export class StatisticsController {
  private readonly logger = new Logger(StatisticsController.name)

  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly statisticsNatsApi: StatisticsNatsApi,
  ) {}

  @ApiOperation({ summary: '获取账号最新数据' })
  @Get('account/latest/:accountId')
  async getAccountDataLatest(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    console.log(accountId)
    return await this.statisticsService.getAccountDataLatest(
      accountId,
    )
  }

  @ApiOperation({ summary: '获取账号增量' })
  @Get('account/increase/:accountId')
  async getAccountDataIncrease(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    console.log(accountId)
    return await this.statisticsService.getAccountDataIncrease(
      accountId,
    )
  }

  @ApiOperation({ summary: '获取账号一段时间内数据' })
  @Get('account/period/:accountId')
  async getAccountDataPeriod(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: getPeriodDateDto,
  ) {
    console.log(accountId, query.startDate, query.endDate)
    return await this.statisticsService.getAccountDataPeriod(
      accountId,
      query.startDate,
      query.endDate,
    )
  }
}
