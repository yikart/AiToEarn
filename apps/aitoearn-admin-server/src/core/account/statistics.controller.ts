import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AppException } from '@yikart/common'
import { config } from '../../config'
import { UserService } from '../user/user.service'
import {
  BatchChannelLatestQueryDto,
  GetChannelDataPeriodByUidsDto,
  getPeriodDateDto,
  TaskPostPeriodDto,
} from './dto/statistics.dto'
import { StatisticsService } from './statistics.service'

@ApiTags('statistics - 数据统计')
@Controller('statistics')
export class StatisticsController {
  private readonly logger = new Logger(StatisticsController.name)

  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: '获取用户的统计数据' })
  @Get('page/:userId')
  async getUserDataPage(
    @Param('userId') userId: string,
  ) {
    const token = await this.userService.getUserToken(userId)
    if (!token)
      throw new AppException(1000, '获取用户Token失败')

    return `${config.userServer.host}/zh-CN/dataStatistics?token=${token}`
  }

  @ApiOperation({ summary: '获取账号最新数据' })
  @Get('account/latest/:accountId')
  async getAccountDataLatest(
    @Param('accountId') accountId: string,
  ) {
    this.logger.log(accountId)
    return await this.statisticsService.getAccountDataLatest(
      accountId,
    )
  }

  @ApiOperation({ summary: '获取账号增量' })
  @Get('account/increase/:accountId')
  async getAccountDataIncrease(
    @Param('accountId') accountId: string,
  ) {
    this.logger.log(accountId)
    return await this.statisticsService.getAccountDataIncrease(
      accountId,
    )
  }

  @ApiOperation({ summary: '获取账号一段时间内数据' })
  @Get('account/period/:accountId')
  async getAccountDataPeriod(
    @Param('accountId') accountId: string,
    @Query() query: getPeriodDateDto,
  ) {
    this.logger.log(accountId, query.startDate, query.endDate)
    return await this.statisticsService.getAccountDataPeriod(
      accountId,
      query.startDate,
      query.endDate,
    )
  }

  @ApiOperation({ summary: '批量获取频道最新数据并汇总粉丝数' })
  @Post('channels/latest-batch')
  async getChannelDataLatestByUids(
    @Body() dto: BatchChannelLatestQueryDto,
  ) {
    return await this.statisticsService.getChannelDataLatestByUids(dto.queries)
  }

  @ApiOperation({ summary: '批量获取频道一段时间数据' })
  @Post('channels/period-batch')
  async getChannelDataPeriodByUids(
    @Body() dto: GetChannelDataPeriodByUidsDto,
  ) {
    return await this.statisticsService.getChannelDataPeriodByUids(dto.queries, dto.startDate, dto.endDate)
  }

  @ApiOperation({ summary: '根据作品ID获取单个作品数据' })
  @Post('post/detail')
  async getPostDetail(
    @Body() body: TaskPostPeriodDto,
  ) {
    return await this.statisticsService.getPostDetail(body.platform, body.postId)
  }
}
