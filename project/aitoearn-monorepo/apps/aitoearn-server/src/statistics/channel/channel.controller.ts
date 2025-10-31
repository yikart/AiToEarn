import { Body, Controller, Logger, Post } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ChannelService } from './channel.service'
import { BatchHistoryPostsRecordDto, searchTopicDto, SubmitChannelCrawlingDto } from './dto/channel.dto'

@Controller('statistics/channels')
export class ChannelController {
  private readonly logger = new Logger(ChannelController.name)
  constructor(
    private readonly channelService: ChannelService,
  ) {}

  /**
   * Douyin search topic
   * @param token
   * @param data
   * @returns
   */
  @ApiOperation({
    summary: 'Topic search',
    description: 'Search topics on Douyin/TikTok',
  })
  @Public()
  @Post('douyin/searchTopic')
  async douYinSerachTopic(
    @Body() data: searchTopicDto,
  ) {
    return this.channelService.getDouyinTopic(data.topic, data?.language)
  }

  /**
   * User selects history publish records and sends them to draft (batch)
   * @param data
   * @returns
   */
  @Post('posts/postsRecord')
  async setHistoryPostsRecord(@Body() data: BatchHistoryPostsRecordDto) {
    return this.channelService.historyPostsRecord(data.records)
  }

  /**
   * Query history records added-to-draft status
   * @param token
   * @returns
   */
  @Post('posts/recordStatus')
  async getHistoryPostsRecordStatus(@GetToken() token: TokenInfo) {
    return this.channelService.historyPostsRecordStatus(token.id)
  }

  /**
   * Submit channel for crawling
   * @param data
   * @returns
   */
  @ApiOperation({
    summary: 'Submit channel for crawling',
    description: 'Submit platform and uid to crawling queue; updateAt is set automatically',
  })
  @Public()
  @Post('crawling/submit')
  async submitChannelCrawling(@Body() data: SubmitChannelCrawlingDto) {
    return this.channelService.submitChannelCrawling(data.platform, data.uid)
  }
}
