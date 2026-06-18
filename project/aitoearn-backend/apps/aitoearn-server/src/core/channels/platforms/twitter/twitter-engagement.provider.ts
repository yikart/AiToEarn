import type {
  ChannelComment,
  ChannelCommentListResult,
  ChannelEngagementActionResult,
  EngagementAccountActionInput,
  EngagementCommentInput,
  EngagementDeleteInput,
  EngagementLikeInput,
  EngagementListInput,
  EngagementProvider,
  EngagementQuoteInput,
} from '../platforms.interface'
import type { TwitterPostData } from './twitter.interface'
import { Injectable } from '@nestjs/common'
import {
  ChannelEngagementActionType,
  ChannelEngagementTargetType,
  ChannelPaginationMode,
} from '../platforms.interface'
import { parsePlatformDate } from '../platforms.utils'
import { TwitterService } from './twitter.service'

@Injectable()
export class TwitterEngagementProvider implements EngagementProvider {
  readonly commentPagination = {
    mode: ChannelPaginationMode.Cursor,
    defaultLimit: 10,
    maxLimit: 100,
    supportsPrevious: false,
  } as const

  constructor(private readonly twitterService: TwitterService) {}

  async listComments(input: EngagementListInput): Promise<ChannelCommentListResult> {
    const limit = input.pagination.limit ?? this.commentPagination.defaultLimit
    const response = await this.twitterService.listReplies(
      input.credential.accessToken,
      input.accountId,
      input.platformWorkId,
      { cursor: input.pagination.cursor, limit },
    )
    const nextCursor = response.meta?.nextToken ?? response.meta?.next_token
    return {
      items: (response.data ?? []).map(post => this.mapPostToComment(post, input.platformWorkId)),
      pagination: {
        mode: ChannelPaginationMode.Cursor,
        nextCursor,
        hasNext: Boolean(nextCursor),
        hasPrevious: false,
        limit,
      },
    }
  }

  async createComment(input: EngagementCommentInput): Promise<ChannelEngagementActionResult> {
    const response = await this.twitterService.createPost(input.credential.accessToken, {
      text: input.content,
      replyTo: input.replyToId ?? input.platformWorkId,
      accountId: input.accountId,
    })
    return {
      actionType: input.replyToId ? ChannelEngagementActionType.Reply : ChannelEngagementActionType.Comment,
      targetType: input.replyToId ? ChannelEngagementTargetType.Comment : ChannelEngagementTargetType.Work,
      targetId: input.replyToId ?? input.platformWorkId,
      platformActionId: response.postId,
      success: true,
      createdAt: new Date(),
    }
  }

  async deleteComment(input: EngagementDeleteInput): Promise<ChannelEngagementActionResult> {
    await this.twitterService.deletePost(input.credential.accessToken, input.commentId, input.accountId)
    return {
      actionType: ChannelEngagementActionType.DeleteComment,
      targetType: ChannelEngagementTargetType.Comment,
      targetId: input.commentId,
      success: true,
      createdAt: new Date(),
    }
  }

  async like(input: EngagementLikeInput): Promise<ChannelEngagementActionResult> {
    await this.twitterService.likePost(
      input.credential.accessToken,
      input.accountId,
      input.credential.platformUid ?? input.accountId,
      input.platformWorkId,
    )
    return {
      actionType: ChannelEngagementActionType.Like,
      targetType: ChannelEngagementTargetType.Work,
      targetId: input.platformWorkId,
      success: true,
      createdAt: new Date(),
    }
  }

  async unlike(input: EngagementLikeInput): Promise<ChannelEngagementActionResult> {
    await this.twitterService.unlikePost(
      input.credential.accessToken,
      input.accountId,
      input.credential.platformUid ?? input.accountId,
      input.platformWorkId,
    )
    return {
      actionType: ChannelEngagementActionType.Unlike,
      targetType: ChannelEngagementTargetType.Work,
      targetId: input.platformWorkId,
      success: true,
      createdAt: new Date(),
    }
  }

  async bookmark(input: EngagementLikeInput): Promise<ChannelEngagementActionResult> {
    await this.twitterService.bookmarkPost(
      input.credential.accessToken,
      input.accountId,
      input.credential.platformUid ?? input.accountId,
      input.platformWorkId,
    )
    return {
      actionType: ChannelEngagementActionType.Bookmark,
      targetType: ChannelEngagementTargetType.Work,
      targetId: input.platformWorkId,
      success: true,
      createdAt: new Date(),
    }
  }

  async removeBookmark(input: EngagementLikeInput): Promise<ChannelEngagementActionResult> {
    await this.twitterService.removeBookmarkPost(
      input.credential.accessToken,
      input.accountId,
      input.credential.platformUid ?? input.accountId,
      input.platformWorkId,
    )
    return {
      actionType: ChannelEngagementActionType.RemoveBookmark,
      targetType: ChannelEngagementTargetType.Work,
      targetId: input.platformWorkId,
      success: true,
      createdAt: new Date(),
    }
  }

  async repost(input: EngagementLikeInput): Promise<ChannelEngagementActionResult> {
    await this.twitterService.repostPost(
      input.credential.accessToken,
      input.accountId,
      input.credential.platformUid ?? input.accountId,
      input.platformWorkId,
    )
    return {
      actionType: ChannelEngagementActionType.Repost,
      targetType: ChannelEngagementTargetType.Work,
      targetId: input.platformWorkId,
      success: true,
      createdAt: new Date(),
    }
  }

  async undoRepost(input: EngagementLikeInput): Promise<ChannelEngagementActionResult> {
    await this.twitterService.undoRepostPost(
      input.credential.accessToken,
      input.accountId,
      input.credential.platformUid ?? input.accountId,
      input.platformWorkId,
    )
    return {
      actionType: ChannelEngagementActionType.UndoRepost,
      targetType: ChannelEngagementTargetType.Work,
      targetId: input.platformWorkId,
      success: true,
      createdAt: new Date(),
    }
  }

  async quote(input: EngagementQuoteInput): Promise<ChannelEngagementActionResult> {
    const response = await this.twitterService.createPost(input.credential.accessToken, {
      text: input.content,
      quoteTweetId: input.platformWorkId,
      accountId: input.accountId,
    })
    return {
      actionType: ChannelEngagementActionType.Quote,
      targetType: ChannelEngagementTargetType.Work,
      targetId: input.platformWorkId,
      platformActionId: response.postId,
      success: true,
      createdAt: new Date(),
    }
  }

  async follow(input: EngagementAccountActionInput): Promise<ChannelEngagementActionResult> {
    await this.twitterService.followUser(
      input.credential.accessToken,
      input.accountId,
      input.credential.platformUid ?? input.accountId,
      input.targetPlatformUid,
    )
    return {
      actionType: ChannelEngagementActionType.Follow,
      targetType: ChannelEngagementTargetType.Account,
      targetId: input.targetPlatformUid,
      success: true,
      createdAt: new Date(),
    }
  }

  async unfollow(input: EngagementAccountActionInput): Promise<ChannelEngagementActionResult> {
    await this.twitterService.unfollowUser(
      input.credential.accessToken,
      input.accountId,
      input.credential.platformUid ?? input.accountId,
      input.targetPlatformUid,
    )
    return {
      actionType: ChannelEngagementActionType.Unfollow,
      targetType: ChannelEngagementTargetType.Account,
      targetId: input.targetPlatformUid,
      success: true,
      createdAt: new Date(),
    }
  }

  private mapPostToComment(post: TwitterPostData, platformWorkId: string): ChannelComment {
    return {
      platformCommentId: post.id ?? '',
      platformWorkId,
      authorPlatformUid: post.author_id ?? post.authorId,
      content: post.text ?? '',
      createdAt: parsePlatformDate(post.created_at ?? post.createdAt),
      likeCount: post.public_metrics?.like_count ?? post.publicMetrics?.likeCount,
      replyCount: post.public_metrics?.reply_count ?? post.publicMetrics?.replyCount,
    }
  }
}
