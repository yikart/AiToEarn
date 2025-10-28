import { Injectable } from '@nestjs/common'

import { PostService } from '../../statistics/post/post.service'
import { EngagementNatsApi } from '../../transports/channel/api/engagement/engagement.api'
import { AIGenCommentDto, AIGenCommentResponseVo, FetchCommentRepliesDto, FetchPostCommentsRequestDto, FetchPostCommentsResponseDto, FetchPostsRequestDto, FetchPostsResponseVo, PublishCommentReplyRequestDto, PublishCommentRequestDto, PublishCommentResponseDto, ReplyToCommentsDto, ReplyToCommentsResponseVo } from './dto/engagement.dto'

@Injectable()
export class EngagementService {
  constructor(
    private readonly engagementNatsApi: EngagementNatsApi,
    private readonly postsService: PostService,
  ) {
  }

  async fetchChannelPosts(data: FetchPostsRequestDto): Promise<FetchPostsResponseVo> {
    return await this.postsService.getPostsByPlatform({
      platform: data.platform,
      uid: data.uid,
      page: data.page || 1,
      pageSize: data.pageSize || 20,
    })
  }

  async fetchPostComments(data: FetchPostCommentsRequestDto): Promise<FetchPostCommentsResponseDto> {
    return await this.engagementNatsApi.fetchPostComments(data)
  }

  async fetchCommentReplies(data: FetchCommentRepliesDto): Promise<FetchPostCommentsResponseDto> {
    return await this.engagementNatsApi.fetchCommentReplies(data)
  }

  async commentOnPost(data: PublishCommentRequestDto): Promise<PublishCommentResponseDto> {
    return await this.engagementNatsApi.commentOnPost(data)
  }

  async replyToComment(data: PublishCommentReplyRequestDto): Promise<PublishCommentResponseDto> {
    return await this.engagementNatsApi.replyToComment(data)
  }

  async generateRepliesByAI(userId: string, data: AIGenCommentDto): Promise<AIGenCommentResponseVo> {
    return await this.engagementNatsApi.generateRepliesByAI(userId, data)
  }

  async replyToCommentsByAI(userId: string, data: ReplyToCommentsDto): Promise<ReplyToCommentsResponseVo> {
    return await this.engagementNatsApi.replyToCommentsByAI(userId, data)
  }
}
