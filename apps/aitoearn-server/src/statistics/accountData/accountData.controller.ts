import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AccountDataService } from './accountData.service'
import {
  GetAccountDataByParamsDto,
  GetAccountDataLatestDto,
  GetAccountDataPeriodDto,
  GetAuthorDataByDateDto,
  GetChannelDataLatestByUidsDto,
  GetChannelDataPeriodByUidsDto,
  NewChannelDto,
} from './dto/accountData.dto'

@ApiTags('统计')
@Controller('statistics')
export class AccountDataController {
  constructor(private readonly accountDataService: AccountDataService) {}

  // 健康检查端点
  @Get('health')
  async healthCheck() {
    try {
      const state = await this.accountDataService.getConnectionState()
      return {
        status: 'ok',
        database: state === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      }
    }
    catch (error: any) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }
    }
  }

  // 调试端点：获取集合信息
  @Get('debug/collection')
  async getCollectionInfo() {
    try {
      const info = await this.accountDataService.getCollectionInfo('bilibili')
      return {
        status: 'ok',
        info,
        timestamp: new Date().toISOString(),
      }
    }
    catch (error: any) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }
    }
  }

  // 根据账号和日期查询频道数据
  // @NatsMessagePattern('statistics.account.getAuthorDataByDate')
  @Post('author/getAuthorDataByDate')
  getAuthorDataByDate(@Body() data: GetAuthorDataByDateDto) {
    const res = this.accountDataService.getAuthorDataByDate(data.accountId, data.platform, data.date)
    return res
  }

  // 根据账号查询频道最新数据
  // @NatsMessagePattern('statistics.account.getAccountDataLatest')
  @Post('account/latest')
  AuthorDataLatest(@Body() data: GetAccountDataLatestDto) {
    const res = this.accountDataService.getAccountDataLatest(data.accountId, data.platform, data.uid)
    return res
  }

  // 根据账号查询频道最新增量数据
  // @NatsMessagePattern('statistics.account.getAccountDataIncrease')
  @Post('account/increase')
  AccountDataIncrease(@Body() data: GetAccountDataLatestDto) {
    const res = this.accountDataService.getAccountDataIncrease(data.platform, data.uid)
    return res
  }

  // 根据查询条件筛选频道
  // @NatsMessagePattern('statistics.account.getAccountDataByParams')
  @Post('account/getAccountDataByParams')
  AccountDataByParams(@Body() data: GetAccountDataByParamsDto) {
    const res = this.accountDataService.getAccountDataByParams(data.params, data.sort, data.pageNo, data.pageSize)
    return res
  }

  // 根据账号查询频道一段时间数据
  // @NatsMessagePattern('statistics.account.getAccountDataPeriod')
  @Post('account/period')
  AccountDataPeriod(@Body() data: GetAccountDataPeriodDto) {
    const res = this.accountDataService.getAccountDataPeriod(data.accountId, data.platform, data.uid, data.startDate, data.endDate)
    return res
  }

  // 根据platform和uid数组查询频道最新数据并汇总fansCount
  // @NatsMessagePattern('statistics.account.getChannelDataLatestByUids')
  @ApiOperation({ summary: '批量获取频道最新数据并汇总粉丝数' })
  @Post('channels/latest-batch')
  getChannelDataLatestByUids(@Body() data: GetChannelDataLatestByUidsDto) {
    const res = this.accountDataService.getChannelDataLatestByUids(data.queries)
    return res
  }

  // 根据platform和uid数组查询频道一段时间增量数据
  // @NatsMessagePattern('statistics.account.getChannelDataPeriodByUids')
  @ApiOperation({ summary: '批量获取频道一段时间数据' })
  @Post('channels/period-batch')
  getChannelDataPeriodByUids(@Body() data: GetChannelDataPeriodByUidsDto) {
    return this.accountDataService.getChannelDataPeriodByUids(data.queries, data?.startDate, data?.endDate)
  }

  // 存储新增channel
  // @NatsMessagePattern('statistics.channel.newChannelReport')
  @Post('channels/newChannelReport')
  setNewChannelReport(@Body() data: NewChannelDto) {
    const res = this.accountDataService.setNewChannels(data.platform, data.uid)
    return res
  }
}
