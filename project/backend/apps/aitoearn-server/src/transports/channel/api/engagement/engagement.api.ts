import { Injectable } from '@nestjs/common'
import { PostsResponseVo } from '@yikart/common'
import {
  AIGenCommentDto,
  AIGenCommentResponseVo,
  FetchAllPostsRequestDto,
  FetchCommentRepliesDto,
  FetchMetaPostsRequestDto,
  FetchPostCommentsRequestDto,
  FetchPostCommentsResponseDto,
  FetchPostsRequestDto,
  FetchPostsResponseVo,
  LikePostRequestDto,
  LikePostResponseDto,
  PublishCommentReplyRequestDto,
  PublishCommentRequestDto,
  PublishCommentResponseDto,
  ReplyToCommentsDto,
} from '../../../../channel/engagement/dto/engagement.dto'
import { ChannelBaseApi } from '../../../channelBase.api'

@Injectable()
export class EngagementNatsApi extends ChannelBaseApi {
  async fetchMetaPosts(payload: FetchMetaPostsRequestDto) {
    const res = await this.sendMessage<PostsResponseVo>(
      `channel/engagement/list/user/posts`,
      payload,
    )
    return res
  }

  async fetchPostComments(payload: FetchPostCommentsRequestDto) {
    const res = await this.sendMessage<FetchPostCommentsResponseDto>(
      `channel/engagement/list/post/comments`,
      payload,
    )
    return res
  }

  async fetchCommentReplies(payload: FetchCommentRepliesDto) {
    const res = await this.sendMessage<FetchPostCommentsResponseDto>(
      `channel/engagement/list/comment/replies`,
      payload,
    )
    return res
  }

  async commentOnPost(payload: PublishCommentRequestDto) {
    const res = await this.sendMessage<PublishCommentResponseDto>(
      `channel/engagement/publish/post/comment`,
      payload,
    )
    return res
  }

  async replyToComment(payload: PublishCommentReplyRequestDto) {
    const res = await this.sendMessage<PublishCommentResponseDto>(
      `channel/engagement/publish/comment/reply`,
      payload,
    )
    return res
  }

  async fetchChannelPosts(payload: FetchPostsRequestDto) {
    const res = await this.sendMessage<FetchPostsResponseVo>(
      `statistics/channelPosts/fetchChannelPosts`,
      payload,
    )
    return res
  }

  async fetchChannelAllPosts(payload: FetchAllPostsRequestDto) {
    const res = await this.sendMessage<FetchPostsResponseVo>(
      `statistics/channelPosts/fetchChannelAllPosts`,
      payload,
    )
    return res
  }

  async generateRepliesByAI(userId: string, payload: AIGenCommentDto) {
    const res = await this.sendMessage<AIGenCommentResponseVo>(
      `channel/engagement/ai/generate/replies`,
      {
        userId,
        ...payload,
      },
    )
    return res
  }

  async replyToCommentsByAI(userId: string, payload: ReplyToCommentsDto) {
    const res = await this.sendMessage<AIGenCommentResponseVo>(
      `channel/engagement/ai/reply/to/comments`,
      {
        userId,
        ...payload,
      },
    )
    return res
  }

  async likePost(payload: LikePostRequestDto) {
    const res = await this.sendMessage<LikePostResponseDto>(
      `channel/engagement/post/like`,
      payload,
    )
    return res
  }

  async unlikePost(payload: LikePostRequestDto) {
    const res = await this.sendMessage<LikePostResponseDto>(
      `channel/engagement/post/unlike`,
      payload,
    )
    return res
  }
}
