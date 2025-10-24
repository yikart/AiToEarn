import { Injectable } from '@nestjs/common'
import { ThreadsService } from '../../../core/plat/meta/threads.service'
import { ThreadsObjectCommentsRequest } from '../../../libs/threads/threads.interfaces'
import { KeysetPagination, OffsetPagination } from '../engagement.dto'
import { EngagementComment, EngagementProvider, FetchPostCommentsResponse, PublishCommentResponse } from '../engagement.interface'

@Injectable()
export class ThreadsEngagementProvider implements EngagementProvider {
  constructor(
    private readonly threadsService: ThreadsService,
  ) { }

  private async fetchThreadsComments(accountId: string, targetId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    const query: ThreadsObjectCommentsRequest = {
      fields: 'id,text,timestamp,has_replies,username',
      reverse: true,
    }
    if ((pagination as KeysetPagination)?.before) {
      query.before = (pagination as KeysetPagination).before || ''
    }
    if ((pagination as KeysetPagination)?.after) {
      query.after = (pagination as KeysetPagination).after || ''
    }
    const resp = await this.threadsService.fetchObjectComments(accountId, targetId, query)
    const comments: EngagementComment[] = []
    for (const item of resp?.data || []) {
      comments.push({
        id: item.id,
        message: item.text,
        author: {
          username: item.username || 'Unknown',
          avatar: '', // Threads API does not provide avatar in comments
        },
        createdAt: item.timestamp,
        hasReplies: item.has_replies || false,
      })
    }
    const result = {
      comments,
      cursor: {
        before: resp?.paging?.cursors?.before || '',
        after: resp?.paging?.cursors?.after || '',
      },
    }
    return result
  }

  private async publishThreadsComment(accountId: string, targetId: string, message: string): Promise<PublishCommentResponse> {
    const resp = await this.threadsService.publishPlaintextComment(accountId, targetId, message)
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
    return this.fetchThreadsComments(accountId, postId, pagination)
  }

  async fetchCommentReplies(accountId: string, commentId: string, pagination: KeysetPagination | OffsetPagination | null): Promise<FetchPostCommentsResponse> {
    return this.fetchThreadsComments(accountId, commentId, pagination)
  }

  async commentOnPost(accountId: string, postId: string, message: string): Promise<PublishCommentResponse> {
    return this.publishThreadsComment(accountId, postId, message)
  }

  async replyToComment(accountId: string, commentId: string, message: string): Promise<PublishCommentResponse> {
    return this.publishThreadsComment(accountId, commentId, message)
  }
}
