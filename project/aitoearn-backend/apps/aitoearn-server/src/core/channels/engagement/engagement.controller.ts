import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import {
  CallEngagementFunctionBodyDto,
  CreateEngagementCommentBodyDto,
  EngagementCommentsQueryDto,
  EngagementExecutionQueryDto,
} from './engagement.dto'
import { EngagementService } from './engagement.service'
import { ChannelCommentListVo, ChannelEngagementActionVo } from './engagement.vo'

@ApiTags('Channels/Engagement')
@Controller({ path: '/channels/engagement', version: '2' })
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @ApiDoc({
    summary: '获取评论列表',
    description: '获取指定作品的评论列表',
    query: EngagementCommentsQueryDto.schema,
    response: ChannelCommentListVo,
  })
  @Get('/comments')
  async listComments(
    @GetToken() token: TokenInfo,
    @Query() query: EngagementCommentsQueryDto,
  ) {
    return ChannelCommentListVo.create(
      await this.engagementService.listComments(
        token.id,
        query.platform,
        query.platformWorkId,
        query.accountId,
        query.pagination,
      ),
    )
  }

  @ApiDoc({
    summary: '发表评论',
    description: '在指定作品下发表评论',
    query: EngagementExecutionQueryDto.schema,
    body: CreateEngagementCommentBodyDto.schema,
    response: ChannelEngagementActionVo,
  })
  @Post('/comments')
  async createComment(
    @GetToken() token: TokenInfo,
    @Query() query: EngagementExecutionQueryDto,
    @Body() body: CreateEngagementCommentBodyDto,
  ) {
    return ChannelEngagementActionVo.create(
      await this.engagementService.createComment(
        token.id,
        query.accountId,
        body.platform,
        body.platformWorkId,
        body.content,
        body.parentCommentId,
      ),
    )
  }

  @ApiDoc({
    summary: '调用互动函数',
    description: '调用平台支持的互动函数',
    query: EngagementExecutionQueryDto.schema,
    body: CallEngagementFunctionBodyDto.schema,
    response: ChannelEngagementActionVo,
  })
  @Post('/function')
  async callFunction(
    @GetToken() token: TokenInfo,
    @Query() query: EngagementExecutionQueryDto,
    @Body() body: CallEngagementFunctionBodyDto,
  ) {
    return ChannelEngagementActionVo.create(
      await this.engagementService.callFunction(
        token.id,
        query.accountId,
        body,
      ),
    )
  }
}
