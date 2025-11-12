import { Body, Controller, Post } from '@nestjs/common'
import { AIGenCommentDto, FetchCommentRepliesRequest, FetchPostCommentsRequest, FetchPostsRequest, PublishCommentReplyRequest, PublishCommentRequest, ReplyToCommentsDto } from './engagement.dto'
import { PublishCommentResponse } from './engagement.interface'
import { EngagementService } from './engagement.service'

@Controller()
export class EngagementController {
  constructor(
    private readonly engagementService: EngagementService,
  ) {}

  @Post('channel/engagement/list/user/posts')
  async fetchUserPosts(@Body() data: FetchPostsRequest) {
    return this.engagementService.fetchUserPosts(data)
  }

  // @NatsMessagePattern('channel.engagement.list.post.comments')
  @Post('channel/engagement/list/post/comments')
  async fetchPostComments(@Body() data: FetchPostCommentsRequest) {
    return this.engagementService.fetchPostComments(data)
  }

  // @NatsMessagePattern('channel.engagement.list.comment.replies')
  @Post('channel/engagement/list/comment/replies')
  async fetchCommentReplies(@Body() data: FetchCommentRepliesRequest) {
    return this.engagementService.fetchCommentReplies(data)
  }

  // @NatsMessagePattern('channel.engagement.publish.post.comment')
  @Post('channel/engagement/publish/post/comment')
  async commentOnPost(@Body() data: PublishCommentRequest): Promise<PublishCommentResponse> {
    return this.engagementService.commentOnPost(data)
  }

  // @NatsMessagePattern('channel.engagement.publish.comment.reply')
  @Post('channel/engagement/publish/comment/reply')
  async replyToComment(@Body() data: PublishCommentReplyRequest): Promise<PublishCommentResponse> {
    return this.engagementService.replyToComment(data)
  }

  // @NatsMessagePattern('channel.engagement.ai.generate.replies')
  @Post('channel/engagement/ai/generate/replies')
  async generateRepliesByAI(@Body() data: AIGenCommentDto) {
    return this.engagementService.batchGenReplyContent(data)
  }

  // @NatsMessagePattern('channel.engagement.ai.reply.to.comments')
  @Post('channel/engagement/ai/reply/to/comments')
  async replyToCommentByAI(@Body() data: ReplyToCommentsDto) {
    return this.engagementService.ReplyToCommentsByAI(data)
  }
}
