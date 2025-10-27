import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { GetToken } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
import { AIGenCommentDto, AIGenCommentResponseVo, FetchCommentRepliesDto, FetchPostCommentsRequestDto, FetchPostCommentsResponseDto, FetchPostsRequestDto, FetchPostsResponseVo, PublishCommentReplyRequestDto, PublishCommentRequestDto, ReplyToCommentsDto, ReplyToCommentsResponseVo } from './dto/engagement.dto'
import { EngagementService } from './engagement.service'

@ApiTags('engagement - 用户互动(评论等)')
@Controller('channel/engagement')
export class EngagementController {
  constructor(
    private readonly engagementService: EngagementService,
  ) { }

  @ApiOperation({ summary: '获取不同平台帖子列表' })
  @Post('posts')
  async fetchChannelPosts(
    @GetToken() token: TokenInfo,
    @Body() data: FetchPostsRequestDto,
  ): Promise<FetchPostsResponseVo> {
    return this.engagementService.fetchChannelPosts(data)
  }

  @ApiOperation({ summary: '获取作品一级评论列表' })
  @Post('post/comments')
  async fetchPostComments(
    @GetToken() token: TokenInfo,
    @Body() data: FetchPostCommentsRequestDto,
  ): Promise<FetchPostCommentsResponseDto> {
    return this.engagementService.fetchPostComments(data)
  }

  @ApiOperation({ summary: '获取评论回复列表' })
  @Post('comment/replies')
  async fetchCommentReplies(
    @GetToken() token: TokenInfo,
    @Body() data: FetchCommentRepliesDto,
  ): Promise<FetchPostCommentsResponseDto> {
    return this.engagementService.fetchCommentReplies(data)
  }

  @ApiOperation({ summary: '在作品下发布评论' })
  @Post('post/comments/publish')
  async commentOnPost(
    @GetToken() token: TokenInfo,
    @Body() data: PublishCommentRequestDto,
  ): Promise<any> {
    return this.engagementService.commentOnPost(data)
  }

  @ApiOperation({ summary: '回复评论' })
  @Post('comment/replies/publish')
  async replyToComment(
    @GetToken() token: TokenInfo,
    @Body() data: PublishCommentReplyRequestDto,
  ): Promise<any> {
    return this.engagementService.replyToComment(data)
  }

  @ApiOperation({ summary: 'AI生成回复' })
  @Post('comment/ai/replies')
  async generateRepliesByAI(
    @GetToken() token: TokenInfo,
    @Body() data: AIGenCommentDto,
  ): Promise<AIGenCommentResponseVo> {
    return this.engagementService.generateRepliesByAI(token.id, data)
  }

  @ApiOperation({ summary: 'AI自动回复评论' })
  @Post('comment/ai/replies/tasks')
  async replyToCommentsByAI(
    @GetToken() token: TokenInfo,
    @Body() data: ReplyToCommentsDto,
  ): Promise<ReplyToCommentsResponseVo> {
    return this.engagementService.replyToCommentsByAI(token.id, data)
  }
}
