import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { GetToken } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
import { ChannelService } from './channel.service'
import { BatchHistoryPostsRecordDto, searchTopicDto } from './dto/channel.dto'

@Controller()
export class ChannelController {
  constructor(
    private readonly channelService: ChannelService,
  ) {}

  /**
   * douyin search topic
   * @param data
   * @returns
   */
  // @NatsMessagePattern('statistics.channel.douyin.searchTopic')
  // @Public()
  @ApiOperation({
    summary: '话题搜索',
    description: '话题搜索',
  })
  @Post('statistics/channels/douyin/searchTopic')
  async douYinSerachTopic(
    @GetToken() token: TokenInfo,
    @Body() data: searchTopicDto,
  ) {
    return this.channelService.getDouyinTopic(data.topic, data?.language)
  }

  /**
   * 用户选择历史发布记录，记录后发送到草稿箱（批量处理）
   * @param data
   * @returns
   */
  // @NatsMessagePattern('statistics.channel.platform.postsRecord')
  @Post('statistics/channels/posts/postsRecord')
  async setHistoryPostsRecord(@Body() data: BatchHistoryPostsRecordDto) {
    return this.channelService.historyPostsRecord(data.records)
  }

  /**
   * query history add to draft status
   * @param userId
   * @returns
   */
  // @NatsMessagePattern('statistics.channel.platform.postsRecordStatus')
  @Post('statistics/channels/posts/recordStatus')
  async getHistoryPostsRecordStatus(@GetToken() token: TokenInfo) {
    return this.channelService.historyPostsRecordStatus(token.id)
  }
}
