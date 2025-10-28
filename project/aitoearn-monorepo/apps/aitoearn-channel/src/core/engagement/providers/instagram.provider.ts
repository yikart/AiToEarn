import { Injectable } from '@nestjs/common'
import { InstagramService } from '../../../core/plat/meta/instagram.service'
import { IGPostCommentsRequest } from '../../../libs/instagram/instagram.interfaces'
import { KeysetPagination, OffsetPagination } from '../engagement.dto'
import { EngagementComment, EngagementProvider, FetchPostCommentsResponse, PublishCommentResponse } from '../engagement.interface'

@Injectable()
export class InstagramEngagementProvider implements EngagementProvider {
  constructor(
    private readonly instagramService: InstagramService,
  ) { }

  async fetchPostComments(accountId: string, postId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    const query: IGPostCommentsRequest = {
      fields: 'id,text,timestamp,from,replies',
    }
    if ((pagination as KeysetPagination)?.before) {
      query.before = (pagination as KeysetPagination).before || ''
    }
    if ((pagination as KeysetPagination)?.after) {
      query.after = (pagination as KeysetPagination).after || ''
    }
    const resp = await this.instagramService.fetchPostComments(accountId, postId, query)
    const comments: EngagementComment[] = []
    for (const item of resp?.data || []) {
      comments.push({
        id: item.id,
        message: item.text,
        author: {
          username: item.from?.username || 'Unknown',
          avatar: '', // Instagram API does not provide avatar in comments
        },
        createdAt: item.timestamp,
        hasReplies: (item.replies?.data.length || 0) > 0,
      })
    }
    const result: FetchPostCommentsResponse = {
      comments,
      cursor: {
        before: resp?.paging?.cursors?.before || '',
        after: resp?.paging?.cursors?.after || '',
      },
    }
    return result
  }

  async fetchCommentReplies(accountId: string, commentId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    const query: IGPostCommentsRequest = {
      fields: 'id,text,timestamp,from',
    }
    if ((pagination as KeysetPagination)?.before) {
      query.before = (pagination as KeysetPagination).before || ''
    }
    if ((pagination as KeysetPagination)?.after) {
      query.after = (pagination as KeysetPagination).after || ''
    }
    const resp = await this.instagramService.fetchCommentReplies(accountId, commentId, query)
    const comments: EngagementComment[] = []
    for (const item of resp?.data || []) {
      comments.push({
        id: item.id,
        message: item.text,
        author: {
          username: item.from?.username || 'Unknown',
          avatar: '', // Instagram API does not provide avatar in comments
        },
        createdAt: item.timestamp,
        hasReplies: false,
      })
    }
    const result: FetchPostCommentsResponse = {
      comments,
      cursor: {
        before: resp?.paging?.cursors?.before || '',
        after: resp?.paging?.cursors?.after || '',
      },
    }
    return result
  }

  async commentOnPost(accountId: string, postId: string, message: string): Promise<PublishCommentResponse> {
    const result: PublishCommentResponse = {
      success: false,
      error: 'Failed to publish comment',
    }
    const resp = await this.instagramService.publishPlaintextComment(accountId, postId, message)
    if (resp?.id) {
      result.id = resp.id
      result.success = true
      result.error = ''
    }
    return result
  }

  async replyToComment(accountId: string, commentId: string, message: string): Promise<PublishCommentResponse> {
    const result: PublishCommentResponse = {
      success: false,
      error: 'Failed to publish comment',
    }
    const resp = await this.instagramService.publishPlaintextCommentReply(accountId, commentId, message)
    if (resp?.id) {
      result.id = resp.id
      result.success = true
      result.error = ''
    }
    return result
  }
}
