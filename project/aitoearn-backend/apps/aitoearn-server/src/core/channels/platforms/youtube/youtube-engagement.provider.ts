import type { youtube_v3 } from 'googleapis'
import type {
  ChannelComment,
  ChannelCommentListResult,
  ChannelEngagementActionResult,
  EngagementCommentInput,
  EngagementDeleteInput,
  EngagementListInput,
  EngagementProvider,
} from '../platforms.interface'
import { Injectable } from '@nestjs/common'
import {
  ChannelEngagementActionType,
  ChannelEngagementTargetType,
  ChannelPaginationMode,
} from '../platforms.interface'
import { parsePlatformDate } from '../platforms.utils'
import { YoutubeService } from './youtube.service'

@Injectable()
export class YoutubeEngagementProvider implements EngagementProvider {
  readonly commentPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 20,
    maxLimit: 100,
    supportsPrevious: false,
  } as const

  constructor(private readonly youtubeService: YoutubeService) {}

  async listComments(input: EngagementListInput): Promise<ChannelCommentListResult> {
    const limit = input.pagination.limit ?? this.commentPagination.defaultLimit
    const response = await this.youtubeService.listComments(
      input.credential.accessToken,
      input.platformWorkId,
      { cursor: input.pagination.cursor, limit },
    )
    return {
      items: (response.items ?? []).map(thread => this.mapCommentThread(thread, input.platformWorkId)),
      pagination: {
        mode: ChannelPaginationMode.Cursor,
        nextCursor: response.nextPageToken ?? undefined,
        hasNext: Boolean(response.nextPageToken),
        hasPrevious: false,
        limit,
      },
    }
  }

  async createComment(input: EngagementCommentInput): Promise<ChannelEngagementActionResult> {
    let platformActionId: string | undefined
    if (input.replyToId) {
      const response = await this.youtubeService.replyComment(
        input.credential.accessToken,
        input.replyToId,
        input.content,
      )
      platformActionId = response.id ?? undefined
    }
    else {
      const response = await this.youtubeService.createComment(
        input.credential.accessToken,
        input.platformWorkId,
        input.content,
      )
      platformActionId = response.id ?? response.snippet?.topLevelComment?.id ?? undefined
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
    await this.youtubeService.deleteComment(input.credential.accessToken, input.commentId)
    return {
      actionType: ChannelEngagementActionType.DeleteComment,
      targetType: ChannelEngagementTargetType.Comment,
      targetId: input.commentId,
      success: true,
      createdAt: new Date(),
    }
  }

  private mapCommentThread(thread: youtube_v3.Schema$CommentThread, platformWorkId: string): ChannelComment {
    const comment = thread.snippet?.topLevelComment
    const snippet = comment?.snippet
    return {
      platformCommentId: comment?.id ?? thread.id ?? '',
      platformWorkId,
      authorName: snippet?.authorDisplayName ?? undefined,
      authorPlatformUid: snippet?.authorChannelId?.value ?? undefined,
      content: snippet?.textOriginal ?? snippet?.textDisplay ?? '',
      createdAt: parsePlatformDate(snippet?.publishedAt),
      likeCount: snippet?.likeCount ?? undefined,
      replyCount: thread.snippet?.totalReplyCount ?? undefined,
    }
  }
}
