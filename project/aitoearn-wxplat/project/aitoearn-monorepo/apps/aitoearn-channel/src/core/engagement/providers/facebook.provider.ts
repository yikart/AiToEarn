import { Injectable } from '@nestjs/common'
import { FacebookService } from '../../../core/plat/meta/facebook.service'
import { FacebookPostCommentsRequest } from '../../../libs/facebook/facebook.interfaces'
import { KeysetPagination, OffsetPagination } from '../engagement.dto'
import { EngagementComment, EngagementProvider, FetchPostCommentsResponse, PublishCommentResponse } from '../engagement.interface'

@Injectable()
export class FacebookEngagementProvider implements EngagementProvider {
  public readonly paginationType = 'keyset'

  constructor(
    private readonly FacebookService: FacebookService,
  ) {}

  private async fetchFacebookObjectComments(accountId: string, targetId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    const query: FacebookPostCommentsRequest = {
      filter: 'toplevel',
      fields: 'id,message,from{name,picture{url}},created_time,comment_count',
      order: 'reverse_chronological',
    }
    if ((pagination as KeysetPagination)?.before) {
      query.before = (pagination as KeysetPagination).before || ''
    }
    if ((pagination as KeysetPagination)?.after) {
      query.after = (pagination as KeysetPagination).after || ''
    }
    const resp = await this.FacebookService.fetchObjectComments(accountId, targetId, query)
    const comments: EngagementComment[] = []
    for (const item of resp?.data || []) {
      comments.push({
        id: item.id,
        message: item.message,
        author: {
          username: item.from?.name || 'Unknown',
          avatar: item.from?.picture?.data?.url || '',
        },
        createdAt: item.created_time,
        hasReplies: (item.comment_count || 0) > 0,
      })
    }
    const result: FetchPostCommentsResponse = {
      comments,
      cursor: {
        before: resp?.paging?.cursors?.before || '',
        after: resp?.paging?.cursors?.after || '',
      } as KeysetPagination,
    }
    return result
  }

  private async publishFacebookObjectComment(accountId: string, targetId: string, message: string): Promise<PublishCommentResponse> {
    const resp = await this.FacebookService.publishPlaintextComment(accountId, targetId, message)
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
    if (pagination && 'offset' in pagination) {
      throw new Error('Facebook provider only supports keyset pagination')
    }
    return this.fetchFacebookObjectComments(accountId, postId, pagination)
  }

  async fetchCommentReplies(accountId: string, commentId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    if (pagination && 'offset' in pagination) {
      throw new Error('Facebook provider only supports keyset pagination')
    }
    return this.fetchFacebookObjectComments(accountId, commentId, pagination)
  }

  async commentOnPost(accountId: string, postId: string, message: string): Promise<PublishCommentResponse> {
    return this.publishFacebookObjectComment(accountId, postId, message)
  }

  async replyToComment(accountId: string, commentId: string, message: string): Promise<PublishCommentResponse> {
    return this.publishFacebookObjectComment(accountId, commentId, message)
  }
}
