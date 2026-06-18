import type {
  ChannelComment,
  ChannelCommentListResult,
  ChannelEngagementActionResult,
  EngagementCommentInput,
  EngagementDeleteInput,
  EngagementListInput,
  EngagementProvider,
} from '../platforms.interface'
import type { InstagramComment, InstagramCommentReply } from './instagram.interface'
import { Injectable } from '@nestjs/common'
import {
  ChannelEngagementActionType,
  ChannelEngagementTargetType,
  ChannelPaginationDirection,
  ChannelPaginationMode,
} from '../platforms.interface'
import { parsePlatformDate } from '../platforms.utils'
import { InstagramService } from './instagram.service'

@Injectable()
export class InstagramEngagementProvider implements EngagementProvider {
  readonly commentPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 25,
    maxLimit: 100,
    supportsPrevious: true,
  } as const

  constructor(private readonly instagramService: InstagramService) {}

  async listComments(input: EngagementListInput): Promise<ChannelCommentListResult> {
    const limit = input.pagination.limit ?? this.commentPagination.defaultLimit
    const response = await this.instagramService.listComments(
      input.credential.accessToken,
      input.platformWorkId,
      {
        ...(input.pagination.cursor && {
          [input.pagination.direction === ChannelPaginationDirection.Previous ? 'before' : 'after']: input.pagination.cursor,
        }),
        limit,
      },
    )
    return {
      items: response.data.flatMap(comment => [
        this.mapComment(comment, input.platformWorkId),
        ...(comment.replies?.data ?? []).map(reply => this.mapReply(reply, input.platformWorkId, comment.id)),
      ]),
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

  async createComment(input: EngagementCommentInput): Promise<ChannelEngagementActionResult> {
    let platformActionId: string
    if (input.replyToId) {
      const response = await this.instagramService.replyComment(
        input.credential.accessToken,
        input.replyToId,
        input.content,
      )
      platformActionId = response.id
    }
    else {
      const response = await this.instagramService.createComment(
        input.credential.accessToken,
        input.platformWorkId,
        input.content,
      )
      platformActionId = response.id
    }

    return {
      actionType: input.replyToId ? ChannelEngagementActionType.Reply : ChannelEngagementActionType.Comment,
      targetType: input.replyToId ? ChannelEngagementTargetType.Comment : ChannelEngagementTargetType.Work,
      targetId: input.replyToId ?? input.platformWorkId,
      platformActionId,
      success: true,
      createdAt: new Date(),
    }
  }

  async deleteComment(input: EngagementDeleteInput): Promise<ChannelEngagementActionResult> {
    await this.instagramService.deleteComment(input.credential.accessToken, input.commentId)
    return {
      actionType: ChannelEngagementActionType.DeleteComment,
      targetType: ChannelEngagementTargetType.Comment,
      targetId: input.commentId,
      success: true,
      createdAt: new Date(),
    }
  }

  private mapComment(comment: InstagramComment, platformWorkId: string): ChannelComment {
    return {
      platformCommentId: comment.id,
      platformWorkId,
      authorName: comment.username,
      content: comment.text ?? '',
      createdAt: parsePlatformDate(comment.timestamp),
      likeCount: comment.like_count,
      replyCount: comment.replies?.data?.length,
    }
  }

  private mapReply(reply: InstagramCommentReply, platformWorkId: string, parentCommentId: string): ChannelComment {
    return {
      platformCommentId: reply.id,
      platformWorkId,
      parentCommentId,
      authorName: reply.username,
      content: reply.text ?? '',
      createdAt: parsePlatformDate(reply.timestamp),
    }
  }
}
