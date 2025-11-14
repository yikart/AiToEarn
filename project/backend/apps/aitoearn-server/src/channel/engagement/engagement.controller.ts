import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, PostsResponseVo } from '@yikart/common'
import { AIGenCommentDto, AIGenCommentResponseVo, FetchCommentRepliesDto, FetchMetaPostsRequestDto, FetchPostCommentsRequestDto, FetchPostCommentsResponseDto, FetchPostsRequestDto, FetchPostsResponseVo, LikePostRequestDto, LikePostResponseDto, PublishCommentReplyRequestDto, PublishCommentRequestDto, PublishCommentResponseDto, ReplyToCommentsDto, ReplyToCommentsResponseVo } from './dto/engagement.dto'
import { EngagementService } from './engagement.service'

@ApiTags('OpenSource/Engage/Engagement')
@Controller('channel/engagement')
export class EngagementController {
  constructor(
    private readonly engagementService: EngagementService,
  ) { }

  @ApiDoc({
    summary: 'List Channel Posts',
    body: FetchPostsRequestDto.schema,
    response: FetchPostsResponseVo,
  })
  @Post('posts')
  async fetchChannelPosts(
    @GetToken() token: TokenInfo,
    @Body() data: FetchPostsRequestDto,
  ): Promise<FetchPostsResponseVo> {
    return this.engagementService.fetchChannelPosts(data)
  }

  @ApiDoc({
    summary: 'List Meta Posts',
    body: FetchMetaPostsRequestDto.schema,
    response: PostsResponseVo,
  })
  @Post('meta/posts')
  async fetchMetaPosts(
    @GetToken() token: TokenInfo,
    @Body() data: FetchMetaPostsRequestDto,
  ): Promise<PostsResponseVo> {
    return this.engagementService.fetchMetaPosts(data)
  }

  @ApiDoc({
    summary: 'List Post Comments',
    body: FetchPostCommentsRequestDto.schema,
    response: FetchPostCommentsResponseDto,
  })
  @Post('post/comments')
  async fetchPostComments(
    @GetToken() token: TokenInfo,
    @Body() data: FetchPostCommentsRequestDto,
  ): Promise<FetchPostCommentsResponseDto> {
    return this.engagementService.fetchPostComments(data)
  }

  @ApiDoc({
    summary: 'List Comment Replies',
    body: FetchCommentRepliesDto.schema,
    response: FetchPostCommentsResponseDto,
  })
  @Post('comment/replies')
  async fetchCommentReplies(
    @GetToken() token: TokenInfo,
    @Body() data: FetchCommentRepliesDto,
  ): Promise<FetchPostCommentsResponseDto> {
    return this.engagementService.fetchCommentReplies(data)
  }

  @ApiDoc({
    summary: 'Publish Comment on Post',
    body: PublishCommentRequestDto.schema,
    response: PublishCommentResponseDto,
  })
  @Post('post/comments/publish')
  async commentOnPost(
    @GetToken() token: TokenInfo,
    @Body() data: PublishCommentRequestDto,
  ): Promise<PublishCommentResponseDto> {
    return this.engagementService.commentOnPost(data)
  }

  @ApiDoc({
    summary: 'Publish Reply to Comment',
    body: PublishCommentReplyRequestDto.schema,
    response: PublishCommentResponseDto,
  })
  @Post('comment/replies/publish')
  async replyToComment(
    @GetToken() token: TokenInfo,
    @Body() data: PublishCommentReplyRequestDto,
  ): Promise<PublishCommentResponseDto> {
    return this.engagementService.replyToComment(data)
  }

  @ApiDoc({
    summary: 'Generate Comment Replies with AI',
    body: AIGenCommentDto.schema,
    response: AIGenCommentResponseVo,
  })
  @Post('comment/ai/replies')
  async generateRepliesByAI(
    @GetToken() token: TokenInfo,
    @Body() data: AIGenCommentDto,
  ): Promise<AIGenCommentResponseVo> {
    return this.engagementService.generateRepliesByAI(token.id, data)
  }

  @ApiDoc({
    summary: 'Reply to Comments with AI Task',
    body: ReplyToCommentsDto.schema,
    response: ReplyToCommentsResponseVo,
  })
  @Post('comment/ai/replies/tasks')
  async replyToCommentsByAI(
    @GetToken() token: TokenInfo,
    @Body() data: ReplyToCommentsDto,
  ): Promise<ReplyToCommentsResponseVo> {
    return this.engagementService.replyToCommentsByAI(token.id, data)
  }

  @ApiDoc({
    summary: 'Like Post (Facebook Page)',
    body: LikePostRequestDto.schema,
    response: LikePostResponseDto,
  })
  @Post('post/like')
  async likePost(
    @GetToken() token: TokenInfo,
    @Body() data: LikePostRequestDto,
  ): Promise<LikePostResponseDto> {
    return this.engagementService.likePost(data)
  }

  @ApiDoc({
    summary: 'Unlike Post (Facebook Page)',
    body: LikePostRequestDto.schema,
    response: LikePostResponseDto,
  })
  @Post('post/unlike')
  async unlikePost(
    @GetToken() token: TokenInfo,
    @Body() data: LikePostRequestDto,
  ): Promise<LikePostResponseDto> {
    return this.engagementService.unlikePost(data)
  }
}
