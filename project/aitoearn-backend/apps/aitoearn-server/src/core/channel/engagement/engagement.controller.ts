import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { AIGenCommentDto, FetchCommentRepliesRequest, FetchMetaPostsRequest, FetchPostCommentsRequest, FetchPostsRequest, LikePostRequest, PublishCommentReplyRequest, PublishCommentRequest, ReplyToCommentsDto } from './engagement.dto'
import { PublishCommentResponse } from './engagement.interface'
import { EngagementService } from './engagement.service'

@ApiTags('Engage/Engagement')
@Controller('channel/engagement')
export class EngagementController {
  constructor(
    private readonly engagementService: EngagementService,
  ) {}

  @ApiDoc({
    summary: 'List Channel Posts',
  })
  @Post('/posts')
  async fetchChannelPosts(
    @GetToken() token: TokenInfo,
    @Body() data: FetchPostsRequest,
  ) {
    return this.engagementService.fetchUserPosts(data)
  }

  @ApiDoc({
    summary: 'List Meta Posts',
    body: FetchMetaPostsRequest.schema,
  })
  @Post('/meta/posts')
  async fetchMetaPosts(
    @GetToken() token: TokenInfo,
    @Body() data: FetchMetaPostsRequest,
  ) {
    return this.engagementService.fetchMetaPosts(data)
  }

  @ApiDoc({
    summary: 'Like Post (Facebook Page)',
    body: LikePostRequest.schema,
  })
  @Post('/post/like')
  async likePost(
    @GetToken() token: TokenInfo,
    @Body() data: LikePostRequest,
  ): Promise<{ success: boolean }> {
    return this.engagementService.likePost(data)
  }

  @ApiDoc({
    summary: 'Unlike Post (Facebook Page)',
    body: LikePostRequest.schema,
  })
  @Post('/post/unlike')
  async unlikePost(
    @GetToken() token: TokenInfo,
    @Body() data: LikePostRequest,
  ): Promise<{ success: boolean }> {
    return this.engagementService.unlikePost(data)
  }

  @ApiDoc({
    summary: 'List Post Comments',
  })
  @Post('/post/comments')
  async fetchPostComments(
    @GetToken() token: TokenInfo,
    @Body() data: FetchPostCommentsRequest,
  ) {
    return this.engagementService.fetchPostComments(data)
  }

  @ApiDoc({
    summary: 'List Comment Replies',
  })
  @Post('/comment/replies')
  async fetchCommentReplies(
    @GetToken() token: TokenInfo,
    @Body() data: FetchCommentRepliesRequest,
  ) {
    return this.engagementService.fetchCommentReplies(data)
  }

  @ApiDoc({
    summary: 'Publish Comment on Post',
  })
  @Post('/post/comments/publish')
  async commentOnPost(
    @GetToken() token: TokenInfo,
    @Body() data: PublishCommentRequest,
  ): Promise<PublishCommentResponse> {
    return this.engagementService.commentOnPost(data)
  }

  @ApiDoc({
    summary: 'Publish Reply to Comment',
  })
  @Post('/comment/replies/publish')
  async replyToComment(
    @GetToken() token: TokenInfo,
    @Body() data: PublishCommentReplyRequest,
  ): Promise<PublishCommentResponse> {
    return this.engagementService.replyToComment(data)
  }

  @ApiDoc({
    summary: 'Generate Comment Replies with AI',
  })
  @Post('/comment/ai/replies')
  async generateRepliesByAI(
    @GetToken() token: TokenInfo,
    @Body() data: AIGenCommentDto,
  ) {
    return this.engagementService.batchGenReplyContent(data)
  }

  @ApiDoc({
    summary: 'Reply to Comments with AI Task',
  })
  @Post('/comment/ai/replies/tasks')
  async replyToCommentsByAI(
    @GetToken() token: TokenInfo,
    @Body() data: ReplyToCommentsDto,
  ) {
    return this.engagementService.ReplyToCommentsByAI(data)
  }

  @Public()
  @ApiDoc({
    summary: 'List User Posts (Crawler)',
    body: FetchPostsRequest.schema,
  })
  @Post('/list/user/posts')
  async crawlerFetchUserPosts(@Body() data: FetchPostsRequest) {
    return this.engagementService.fetchUserPosts(data)
  }
}
