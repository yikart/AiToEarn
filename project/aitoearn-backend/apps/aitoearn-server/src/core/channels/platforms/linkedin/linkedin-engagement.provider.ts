import type {
  ChannelComment,
  ChannelCommentListResult,
  ChannelEngagementActionResult,
  EngagementCommentInput,
  EngagementDeleteInput,
  EngagementListInput,
  EngagementProvider,
} from '../platforms.interface'
import type { LinkedInComment } from './linkedin.interface'
import { Injectable } from '@nestjs/common'
import {
  ChannelEngagementActionType,
  ChannelEngagementTargetType,
  ChannelPaginationMode,
} from '../platforms.interface'
import { LinkedInService } from './linkedin.service'

@Injectable()
export class LinkedInEngagementProvider implements EngagementProvider {
  readonly commentPagination = {
    mode: ChannelPaginationMode.Page,
    defaultPageSize: 10,
    maxPageSize: 100,
    supportsTotal: true,
  } as const

  constructor(private readonly linkedinService: LinkedInService) {}

  async listComments(input: EngagementListInput): Promise<ChannelCommentListResult> {
    const page = input.pagination.page ?? 1
    const pageSize = input.pagination.pageSize ?? this.commentPagination.defaultPageSize
    const start = (page - 1) * pageSize
    const response = await this.linkedinService.listComments(
      input.credential.accessToken,
      input.platformWorkId,
      { start, count: pageSize },
    )
    const total = response.paging?.total
    const nextStart = start + pageSize
    return {
      items: (response.elements ?? []).map(comment => this.mapComment(comment, input.platformWorkId)),
      pagination: {
        mode: ChannelPaginationMode.Page,
        page,
        pageSize,
        total,
        hasNext: total === undefined
          ? (response.elements ?? []).length >= pageSize
          : nextStart < total,
        hasPrevious: page > 1,
      },
    }
  }

  async createComment(input: EngagementCommentInput): Promise<ChannelEngagementActionResult> {
    const response = await this.linkedinService.createComment(
      input.credential.accessToken,
      input.replyToId ?? input.platformWorkId,
      input.content,
    )
    return {
      actionType: input.replyToId ? ChannelEngagementActionType.Reply : ChannelEngagementActionType.Comment,
      targetType: input.replyToId ? ChannelEngagementTargetType.Comment : ChannelEngagementTargetType.Work,
      targetId: input.replyToId ?? input.platformWorkId,
      platformActionId: response.id ?? response.entity,
      success: true,
      createdAt: new Date(),
    }
  }

  async deleteComment(input: EngagementDeleteInput): Promise<ChannelEngagementActionResult> {
    await this.linkedinService.deleteComment(input.credential.accessToken, input.commentId)
    return {
      actionType: ChannelEngagementActionType.DeleteComment,
      targetType: ChannelEngagementTargetType.Comment,
      targetId: input.commentId,
      success: true,
      createdAt: new Date(),
    }
  }

  private mapComment(comment: LinkedInComment, platformWorkId: string): ChannelComment {
    return {
      platformCommentId: comment.id ?? comment.entity ?? '',
      platformWorkId,
      authorPlatformUid: comment.actor ?? comment.created?.actor,
      content: comment.message?.text ?? '',
      createdAt: this.parseMillis(comment.created?.time),
    }
  }

  private parseMillis(value?: number): Date | undefined {
    if (value === undefined) {
      return undefined
    }
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date
  }
}
