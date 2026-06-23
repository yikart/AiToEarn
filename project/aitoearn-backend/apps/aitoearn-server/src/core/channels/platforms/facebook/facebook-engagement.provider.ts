import type {
  ChannelComment,
  ChannelCommentListResult,
  ChannelEngagementActionResult,
  EngagementCommentInput,
  EngagementDeleteInput,
  EngagementLikeInput,
  EngagementListInput,
  EngagementProvider,
} from '../platforms.interface'
import type { FacebookComment } from './facebook.interface'
import { Injectable } from '@nestjs/common'
import {
  ChannelEngagementActionType,
  ChannelEngagementTargetType,
  ChannelPaginationDirection,
  ChannelPaginationMode,
} from '../platforms.interface'
import { parsePlatformDate } from '../platforms.utils'
import { FacebookService } from './facebook.service'

@Injectable()
export class FacebookEngagementProvider implements EngagementProvider {
  readonly commentPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 25,
    maxLimit: 100,
    supportsPrevious: true,
  } as const

  constructor(private readonly facebookService: FacebookService) {}

  async listComments(input: EngagementListInput): Promise<ChannelCommentListResult> {
    const limit = input.pagination.limit ?? this.commentPagination.defaultLimit
    const response = await this.facebookService.listComments(
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
      items: response.data.map(comment => this.mapComment(comment, input.platformWorkId)),
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
    const response = await this.facebookService.createComment(
      input.credential.accessToken,
      input.replyToId ?? input.platformWorkId,
      input.content,
    )
    return {
      actionType: input.replyToId ? ChannelEngagementActionType.Reply : ChannelEngagementActionType.Comment,
      targetType: input.replyToId ? ChannelEngagementTargetType.Comment : ChannelEngagementTargetType.Work,
      targetId: input.replyToId ?? input.platformWorkId,
      platformActionId: response.id,
      success: true,
      createdAt: new Date(),
    }
  }

  async deleteComment(input: EngagementDeleteInput): Promise<ChannelEngagementActionResult> {
    await this.facebookService.deleteComment(input.credential.accessToken, input.commentId)
    return {
      actionType: ChannelEngagementActionType.DeleteComment,
      targetType: ChannelEngagementTargetType.Comment,
      targetId: input.commentId,
      success: true,
      createdAt: new Date(),
    }
  }

  async like(input: EngagementLikeInput): Promise<ChannelEngagementActionResult> {
    await this.facebookService.likeObject(input.credential.accessToken, input.platformWorkId)
    return {
      actionType: ChannelEngagementActionType.Like,
      targetType: ChannelEngagementTargetType.Work,
      targetId: input.platformWorkId,
      success: true,
      createdAt: new Date(),
    }
  }

  async unlike(input: EngagementLikeInput): Promise<ChannelEngagementActionResult> {
    await this.facebookService.unlikeObject(input.credential.accessToken, input.platformWorkId)
    return {
      actionType: ChannelEngagementActionType.Unlike,
      targetType: ChannelEngagementTargetType.Work,
      targetId: input.platformWorkId,
      success: true,
      createdAt: new Date(),
    }
  }

  private mapComment(comment: FacebookComment, platformWorkId: string): ChannelComment {
    return {
      platformCommentId: comment.id,
      platformWorkId,
      parentCommentId: comment.parent?.id,
      authorName: comment.from?.name,
      authorPlatformUid: comment.from?.id,
      content: comment.message ?? '',
      createdAt: parsePlatformDate(comment.created_time),
      likeCount: comment.like_count,
      replyCount: comment.comment_count,
    }
  }
}
