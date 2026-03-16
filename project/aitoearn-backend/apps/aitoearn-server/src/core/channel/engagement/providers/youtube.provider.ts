import { Injectable, Logger } from '@nestjs/common'
import { PostsResponseVo, PostVo } from '@yikart/common'
import { GaxiosResponse } from 'gaxios'
import { youtube_v3 } from 'googleapis'
import { YoutubeService } from '../../platforms/youtube/youtube.service'
import { KeysetPagination, OffsetPagination } from '../engagement.dto'
import { EngagementComment, EngagementProvider, FetchPostCommentsResponse, PublishCommentResponse } from '../engagement.interface'

function isGaxiosResponse<T>(value: unknown): value is GaxiosResponse<T> {
  return value !== null && typeof value === 'object' && 'data' in value
}

@Injectable()
export class YoutubeEngagementProvider implements EngagementProvider {
  private readonly logger = new Logger(YoutubeEngagementProvider.name)
  constructor(
    private readonly youtubeService: YoutubeService,
  ) { }

  async fetchUserPosts(accountId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<PostsResponseVo> {
    this.logger.log(`fetchUserPosts called with accountId: ${accountId}, pagination: ${JSON.stringify(pagination)}`)
    return {
      posts: [],
      cursor: {
        before: '',
        after: '',
      },
    }
  }

  async getMetaPostDetail(_accountId: string, _postId: string): Promise<PostVo> {
    return {
      id: '',
      platform: '',
      title: '',
      content: '',
      medias: [],
      permalink: '',
      publishTime: 0,
      viewCount: 0,
      commentCount: 0,
      likeCount: 0,
      shareCount: 0,
      clickCount: 0,
      impressionCount: 0,
      favoriteCount: 0,
    }
  }

  private async fetchYoutubeCommentsThreads(accountId: string, videoId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    const rawResp = await this.youtubeService.getCommentThreadsList(
      accountId,
      undefined, // allThreadsRelatedToChannelId
      undefined, // id
      videoId,
      (pagination as KeysetPagination)?.limit || undefined, // maxResults
      (pagination as KeysetPagination)?.after || undefined, // pageToken
      undefined, // order
      undefined, // searchTerms
    )
    this.logger.log(`fetchYoutubeCommentsThreads result: - ${JSON.stringify(rawResp)}`)

    if (!isGaxiosResponse<youtube_v3.Schema$CommentThreadListResponse>(rawResp)) {
      return { comments: [], cursor: { before: '', after: '' } }
    }
    const resp = rawResp.data

    const comments: EngagementComment[] = []
    for (const item of resp?.items || []) {
      comments.push({
        id: item.id || '',
        message: item.snippet?.topLevelComment?.snippet?.textDisplay || '',
        author: {
          username: item.snippet?.topLevelComment?.snippet?.authorDisplayName || 'Unknown',
          avatar: item.snippet?.topLevelComment?.snippet?.authorProfileImageUrl || '',
        },
        createdAt: item.snippet?.topLevelComment?.snippet?.publishedAt || '',
        hasReplies: (item.replies?.comments?.length || 0) > 0,
      })
    }
    const result = {
      comments,
      cursor: {
        before: '',
        after: resp?.nextPageToken || '',
      },
    }
    return result
  }

  private async fetchYoutubeComments(accountId: string, parentId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    const rawResp = await this.youtubeService.getCommentsList(
      accountId,
      parentId,
      undefined,
      (pagination as KeysetPagination)?.limit || undefined, // maxResults
      (pagination as KeysetPagination)?.after || undefined, // pageToken
    )
    this.logger.log(`fetchYoutubeComments result: - ${JSON.stringify(rawResp)}`)

    if (!isGaxiosResponse<youtube_v3.Schema$CommentListResponse>(rawResp)) {
      return { comments: [], cursor: { before: '', after: '' } }
    }
    const resp = rawResp.data

    const comments: EngagementComment[] = []
    for (const item of resp?.items || []) {
      comments.push({
        id: item.id || '',
        message: item.snippet?.textDisplay || '',
        author: {
          username: item.snippet?.authorDisplayName || 'Unknown',
          avatar: item.snippet?.authorProfileImageUrl || '',
        },
        createdAt: item.snippet?.publishedAt || '',
        hasReplies: false,
      })
    }
    const result = {
      comments,
      cursor: {
        before: '',
        after: resp?.nextPageToken || '',
      },
    }
    return result
  }

  private async publishYoutubeCommentThreads(accountId: string, targetId: string, message: string): Promise<PublishCommentResponse> {
    const rawResp = await this.youtubeService.insertCommentThreads(accountId, undefined, targetId, message)

    if (isGaxiosResponse<youtube_v3.Schema$CommentThread>(rawResp) && rawResp.data?.id) {
      return {
        id: rawResp.data.id,
        success: true,
      }
    }
    else {
      return {
        success: false,
        error: 'Failed to publish comment',
      }
    }
  }

  private async publishYoutubeComment(accountId: string, targetId: string, message: string): Promise<PublishCommentResponse> {
    const rawResp = await this.youtubeService.insertComment(accountId, targetId, message)

    if (isGaxiosResponse<youtube_v3.Schema$Comment>(rawResp) && rawResp.data?.id) {
      return {
        id: rawResp.data.id,
        success: true,
      }
    }
    else {
      return {
        success: false,
        error: 'Failed to publish comment',
      }
    }
  }

  async fetchPostComments(accountId: string, postId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    return this.fetchYoutubeCommentsThreads(accountId, postId, pagination)
  }

  async fetchCommentReplies(accountId: string, commentId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    return this.fetchYoutubeComments(accountId, commentId, pagination)
  }

  async commentOnPost(accountId: string, postId: string, message: string): Promise<PublishCommentResponse> {
    return this.publishYoutubeCommentThreads(accountId, postId, message)
  }

  async replyToComment(accountId: string, commentId: string, message: string): Promise<PublishCommentResponse> {
    return this.publishYoutubeComment(accountId, commentId, message)
  }
}
