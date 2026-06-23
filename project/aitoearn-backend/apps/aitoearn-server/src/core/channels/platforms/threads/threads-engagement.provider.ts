import type {
  ChannelComment,
  ChannelCommentListResult,
  ChannelEngagementActionResult,
  EngagementCommentActionInput,
  EngagementDeleteInput,
  EngagementListInput,
  EngagementProvider,
} from '../platforms.interface'
import type { ThreadsReplyListResponse } from './threads.interface'
import { Injectable } from '@nestjs/common'
import {
  ChannelEngagementActionType,
  ChannelEngagementTargetType,
  ChannelPaginationDirection,
  ChannelPaginationMode,
} from '../platforms.interface'
import { parsePlatformDate } from '../platforms.utils'
import { ThreadsService } from './threads.service'

@Injectable()
export class ThreadsEngagementProvider implements EngagementProvider {
  readonly commentPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 25,
    maxLimit: 100,
    supportsPrevious: true,
  } as const

  constructor(private readonly threadsService: ThreadsService) {}

  async listComments(input: EngagementListInput): Promise<ChannelCommentListResult> {
    const limit = input.pagination.limit ?? this.commentPagination.defaultLimit
    const response = await this.threadsService.listReplies(
      input.platformWorkId,
      input.credential.accessToken,
      {
        ...(input.pagination.cursor && {
          [input.pagination.direction === ChannelPaginationDirection.Previous ? 'before' : 'after']: input.pagination.cursor,
        }),
        limit,
      },
    )
    return {
      items: this.mapReplies(response, input.platformWorkId),
      pagination: {
        mode: ChannelPaginationMode.Cursor,
        nextCursor: response.paging?.cursors?.after,
        previousCursor: response.paging?.cursors?.before,
        hasNext: Boolean(response.paging?.next),
        hasPrevious: Boolean(response.paging?.previous),
        limit,
      },
    }
  }

  async deleteComment(input: EngagementDeleteInput): Promise<ChannelEngagementActionResult> {
    await this.threadsService.deleteReply(input.commentId, input.credential.accessToken)
    return {
      actionType: ChannelEngagementActionType.DeleteComment,
      targetType: ChannelEngagementTargetType.Comment,
      targetId: input.commentId,
      success: true,
      createdAt: new Date(),
    }
  }

  async hideReply(input: EngagementCommentActionInput): Promise<ChannelEngagementActionResult> {
    await this.threadsService.hideReply(input.commentId, input.credential.accessToken, true)
    return {
      actionType: ChannelEngagementActionType.HideReply,
      targetType: ChannelEngagementTargetType.Comment,
      targetId: input.commentId,
      success: true,
      createdAt: new Date(),
    }
  }

  async unhideReply(input: EngagementCommentActionInput): Promise<ChannelEngagementActionResult> {
    await this.threadsService.hideReply(input.commentId, input.credential.accessToken, false)
    return {
      actionType: ChannelEngagementActionType.UnhideReply,
      targetType: ChannelEngagementTargetType.Comment,
      targetId: input.commentId,
      success: true,
      createdAt: new Date(),
    }
  }

  private mapReplies(response: ThreadsReplyListResponse, platformWorkId: string): ChannelComment[] {
    return (response.data ?? []).map(reply => ({
      platformCommentId: reply.id,
      platformWorkId,
      authorName: reply.username,
      content: reply.text ?? '',
      createdAt: parsePlatformDate(reply.timestamp),
    }))
  }
}
