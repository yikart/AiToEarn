import { Injectable, Logger } from '@nestjs/common'
import { PostsResponseVo } from '@yikart/common'
import { YoutubeService } from '../../../core/platforms/youtube/youtube.service'
import { KeysetPagination, OffsetPagination } from '../engagement.dto'
import { EngagementComment, EngagementProvider, FetchPostCommentsResponse, PublishCommentResponse } from '../engagement.interface'

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

  private async fetchYoutubeCommentsThreads(accountId: string, videoId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    const resp = await this.youtubeService.getCommentThreadsList(
      accountId,
      undefined, // allThreadsRelatedToChannelId
      undefined, // id
      videoId,
      (pagination as KeysetPagination)?.limit || undefined, // maxResults
      (pagination as KeysetPagination)?.after || undefined, // pageToken
      undefined, // order
      undefined, // searchTerms
    )
    this.logger.log(`fetchYoutubeCommentsThreads result: - ${JSON.stringify(resp)}`)

    const comments: EngagementComment[] = []
    for (const item of resp?.items || []) {
      comments.push({
        id: item.id,
        message: item.snippet.topLevelComment.snippet.textDisplay,
        author: {
          username: item.snippet.topLevelComment.snippet.authorDisplayName || 'Unknown',
          avatar: item.snippet.topLevelComment.snippet.authorProfileImageUrl || '', // Threads API does not provide avatar in comments
        },
        createdAt: item.snippet.topLevelComment.snippet.publishAt,
        hasReplies: (item.replies?.comments.length || 0) > 0,
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
    const resp = await this.youtubeService.getCommentsList(
      accountId,
      parentId,
      undefined,
      (pagination as KeysetPagination)?.limit || undefined, // maxResults
      (pagination as KeysetPagination)?.after || undefined, // pageToken
    )
    this.logger.log(`fetchYoutubeComments result: - ${JSON.stringify(resp)}`)

    const comments: EngagementComment[] = []
    for (const item of resp?.items || []) {
      comments.push({
        id: item.id,
        message: item.snippet.snippet.textDisplay,
        author: {
          username: item.snippet.authorDisplayName || 'Unknown',
          avatar: item.snippet.authorProfileImageUrl || '', // Threads API does not provide avatar in comments
        },
        createdAt: item.snippet.publishAt,
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
    const resp = await this.youtubeService.insertCommentThreads(accountId, undefined, targetId, message)

    if (resp?.id) {
      return {
        id: resp.id,
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
    const resp = await this.youtubeService.insertComment(accountId, targetId, message)

    if (resp?.id) {
      return {
        id: resp.id,
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
