import { Body, Controller, Logger, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { ChannelService } from './channel.service'
import { BatchHistoryPostsRecordDto, NewChannelDto, searchTopicDto, SubmitChannelCrawlingDto } from './dto/channel.dto'

@ApiTags('OpenSource/Home/Statistics/Channel')
@Controller('statistics/channels')
export class ChannelController {
  private readonly logger = new Logger(ChannelController.name)
  constructor(
    private readonly channelService: ChannelService,
  ) {}

  /**
   * Douyin search topic
   * @param data
   * @returns
   */
  @ApiDoc({
    summary: 'Search Douyin Topics',
    description: 'Search topics on Douyin/TikTok platforms.',
    body: searchTopicDto.schema,
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
  @ApiDoc({
    summary: 'Send History Posts to Draft',
    body: BatchHistoryPostsRecordDto.schema,
  })
  @Post('posts/postsRecord')
  async setHistoryPostsRecord(@Body() data: BatchHistoryPostsRecordDto) {
    return this.channelService.historyPostsRecord(data.records)
  }

  /**
   * Query history records added-to-draft status
   * @param token
   * @returns
   */
  @ApiDoc({
    summary: 'Get History Post Draft Status',
  })
  @Post('posts/recordStatus')
  async getHistoryPostsRecordStatus(@GetToken() token: TokenInfo) {
    return this.channelService.historyPostsRecordStatus(token.id)
  }

  /**
   * Submit channel for crawling
   * @param data
   * @returns
   */
  @ApiDoc({
    summary: 'Submit Channel for Crawling',
    description: 'Submit platform and uid to the crawling queue; updatedAt is set automatically.',
    body: SubmitChannelCrawlingDto.schema,
  })
  @Public()
  @Post('crawling/submit')
  async submitChannelCrawling(@Body() data: SubmitChannelCrawlingDto) {
    return this.channelService.submitChannelCrawling(data.platform, data.uid)
  }

  // report new channel to crawler
  @ApiDoc({
    summary: 'Report New Channel to Crawler',
  })
  @Post('channels/newChannelReport')
  setNewChannelReport(@Body() data: NewChannelDto) {
    const res = this.channelService.setNewChannels(data.platform, data.uid)
    return res
  }
}
