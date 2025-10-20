import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { config } from '../../../config'
import { AIGenCommentDto, AIGenCommentResponseVo, FetchAllPostsRequestDto, FetchCommentRepliesDto, FetchPostCommentsRequestDto, FetchPostCommentsResponseDto, FetchPostsRequestDto, FetchPostsResponseVo, PublishCommentReplyRequestDto, PublishCommentRequestDto, PublishCommentResponseDto, ReplyToCommentsDto } from '../../engagement/dto/engagement.dto'

@Injectable()
export class EngagementNatsApi {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  async fetchPostComments(payload: FetchPostCommentsRequestDto) {
    const res = await this.httpService.axiosRef.post<FetchPostCommentsResponseDto>(
      `${config.channel.baseUrl}/channel/engagement/fetchPostComments`,
      payload,
    )
    return res.data
  }

  async fetchCommentReplies(payload: FetchCommentRepliesDto) {
    const res = await this.httpService.axiosRef.post<FetchPostCommentsResponseDto>(
      `${config.channel.baseUrl}/channel/engagement/fetchPostComments`,
      payload,
    )
    return res.data
  }

  async commentOnPost(payload: PublishCommentRequestDto) {
    const res = await this.httpService.axiosRef.post<PublishCommentResponseDto>(
      `${config.channel.baseUrl}/channel/engagement/commentOnPost`,
      payload,
    )
    return res.data
  }

  async replyToComment(payload: PublishCommentReplyRequestDto) {
    const res = await this.httpService.axiosRef.post<PublishCommentResponseDto>(
      `${config.channel.baseUrl}/channel/engagement/replyToComment`,
      payload,
    )
    return res.data
  }

  async fetchChannelPosts(payload: FetchPostsRequestDto) {
    const res = await this.httpService.axiosRef.post<FetchPostsResponseVo>(
      `${config.channel.baseUrl}/statistics/channelPosts/fetchChannelPosts`,
      payload,
    )
    return res.data
  }

  async fetchChannelAllPosts(payload: FetchAllPostsRequestDto) {
    const res = await this.httpService.axiosRef.post<FetchPostsResponseVo>(
      `${config.channel.baseUrl}/statistics/channelPosts/fetchChannelAllPosts`,
      payload,
    )
    return res.data
  }

  async generateRepliesByAI(userId: string, payload: AIGenCommentDto) {
    const res = await this.httpService.axiosRef.post<AIGenCommentResponseVo>(
      `${config.channel.baseUrl}/channel/engagement/generateRepliesByAI`,
      {
        userId,
        ...payload,
      },
    )
    return res.data
  }

  async replyToCommentsByAI(userId: string, payload: ReplyToCommentsDto) {
    const res = await this.httpService.axiosRef.post<AIGenCommentResponseVo>(
      `${config.channel.baseUrl}/channel/engagement/replyToCommentByAI`,
      {
        userId,
        ...payload,
      },
    )
    return res.data
  }
}
