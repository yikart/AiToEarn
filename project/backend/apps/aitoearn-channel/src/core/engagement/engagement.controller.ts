import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
import { AIGenCommentDto, FetchCommentRepliesRequest, FetchPostCommentsRequest, FetchPostsRequest, PublishCommentReplyRequest, PublishCommentRequest, ReplyToCommentsDto } from './engagement.dto'
import { PublishCommentResponse } from './engagement.interface'
import { EngagementService } from './engagement.service'

@ApiTags('OpenSource/Core/Engagement/Engagement')
@Controller()
export class EngagementController {
  constructor(
    private readonly engagementService: EngagementService,
  ) {}

  @ApiDoc({
    summary: 'List User Posts',
  })
  @Post('channel/engagement/list/user/posts')
  async fetchUserPosts(@Body() data: FetchPostsRequest) {
    return this.engagementService.fetchUserPosts(data)
  }

  // @NatsMessagePattern('channel.engagement.list.post.comments')
  @ApiDoc({
    summary: 'List Post Comments',
  })
  @Post('channel/engagement/list/post/comments')
  async fetchPostComments(@Body() data: FetchPostCommentsRequest) {
    return this.engagementService.fetchPostComments(data)
  }

  // @NatsMessagePattern('channel.engagement.list.comment.replies')
  @ApiDoc({
    summary: 'List Comment Replies',
  })
  @Post('channel/engagement/list/comment/replies')
  async fetchCommentReplies(@Body() data: FetchCommentRepliesRequest) {
    return this.engagementService.fetchCommentReplies(data)
  }

  // @NatsMessagePattern('channel.engagement.publish.post.comment')
  @ApiDoc({
    summary: 'Publish Post Comment',
  })
  @Post('channel/engagement/publish/post/comment')
  async commentOnPost(@Body() data: PublishCommentRequest): Promise<PublishCommentResponse> {
    return this.engagementService.commentOnPost(data)
  }

  // @NatsMessagePattern('channel.engagement.publish.comment.reply')
  @ApiDoc({
    summary: 'Publish Comment Reply',
  })
  @Post('channel/engagement/publish/comment/reply')
  async replyToComment(@Body() data: PublishCommentReplyRequest): Promise<PublishCommentResponse> {
    return this.engagementService.replyToComment(data)
  }

  // @NatsMessagePattern('channel.engagement.ai.generate.replies')
  @ApiDoc({
    summary: 'Generate Comment Replies with AI',
  })
  @Post('channel/engagement/ai/generate/replies')
  async generateRepliesByAI(@Body() data: AIGenCommentDto) {
    return this.engagementService.batchGenReplyContent(data)
  }

  // @NatsMessagePattern('channel.engagement.ai.reply.to.comments')
  @ApiDoc({
    summary: 'Reply to Comments with AI',
  })
  @Post('channel/engagement/ai/reply/to/comments')
  async replyToCommentByAI(@Body() data: ReplyToCommentsDto) {
    return this.engagementService.ReplyToCommentsByAI(data)
  }
}
