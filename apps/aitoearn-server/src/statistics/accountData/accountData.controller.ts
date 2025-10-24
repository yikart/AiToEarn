import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '../../auth/auth.guard'
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
  @Public()
  @Post('author/getAuthorDataByDate')
  getAuthorDataByDate(@Body() data: GetAuthorDataByDateDto) {
    const res = this.accountDataService.getAuthorDataByDate(data.accountId, data.platform, data.date)
    return res
  }

  // 根据账号查询频道最新数据
  // @NatsMessagePattern('statistics.account.getAccountDataLatest')
  @Post('account/getAccountDataLatest')
  AuthorDataLatest(@Body() data: GetAccountDataLatestDto) {
    const res = this.accountDataService.getAccountDataLatest(data.accountId, data.platform, data.uid)
    return res
  }

  // 根据账号查询频道最新增量数据
  // @NatsMessagePattern('statistics.account.getAccountDataIncrease')
  @Post('account/getAccountDataIncrease')
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
  @Post('account/getAccountDataPeriod')
  AccountDataPeriod(@Body() data: GetAccountDataPeriodDto) {
    const res = this.accountDataService.getAccountDataPeriod(data.accountId, data.platform, data.uid, data.startDate, data.endDate)
    return res
  }

  // 根据platform和uid数组查询频道最新数据并汇总fansCount
  // @NatsMessagePattern('statistics.account.getChannelDataLatestByUids')
  @Public()
  @Post('channels/period-batch')
  getChannelDataLatestByUids(@Body() data: GetChannelDataLatestByUidsDto) {
    const res = this.accountDataService.getChannelDataLatestByUids(data.queries)
    return res
  }

  // 根据platform和uid数组查询频道一段时间增量数据
  // @NatsMessagePattern('statistics.account.getChannelDataPeriodByUids')
  @Post('channel/getChannelDataPeriodByUids')
  getChannelDataPeriodByUids(@Body() data: GetChannelDataPeriodByUidsDto) {
    // const res = this.accountDataService.getChannelDataPeriodByUids(data.queries, data?.startDate, data?.endDate)
    return this.accountDataService.getChannelDataPeriodByUids(data.queries, data?.startDate, data?.endDate)
  }

  // 存储新增channel
  // @NatsMessagePattern('statistics.channel.newChannelReport')
  @Post('channel/newChannelReport')
  setNewChannelReport(@Body() data: NewChannelDto) {
    const res = this.accountDataService.setNewChannels(data.platform, data.uid)
    return res
  }
}
