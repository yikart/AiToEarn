import type { AccountType } from '@yikart/common'
import type {
  ChannelPaginationInput,
  CredentialContext,
  EngagementAccountActionInput,
  EngagementCommentActionInput,
  EngagementCommentInput,
  EngagementDeleteInput,
  EngagementLikeInput,
  EngagementListInput,
  EngagementQuoteInput,
} from '../platforms/platforms.interface'
import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { AccountRepository } from '@yikart/mongodb'
import { RelayAccountException } from '../../relay/relay-account.exception'
import { AuthService } from '../auth/auth.service'
import { normalizeChannelPagination } from '../platforms/platform-pagination.helper'
import { ChannelEngagementFunctionName } from '../platforms/platforms.interface'
import { PlatformIntegrationRegistry } from '../platforms/platforms.registry'
import {
  CallEngagementFunctionBodyDto,
  DeleteEngagementCommentFunctionDataSchema,
  EngagementAccountFunctionDataSchema,
  EngagementCommentFunctionDataSchema,
  EngagementWorkFunctionDataSchema,
  QuoteEngagementWorkFunctionDataSchema,
} from './engagement.dto'

@Injectable()
export class EngagementService {
  constructor(
    private readonly registry: PlatformIntegrationRegistry,
    private readonly authService: AuthService,
    private readonly accountRepository: AccountRepository,
  ) {}

  async listComments(
    userId: string,
    platform: AccountType,
    platformWorkId: string,
    accountId: string,
    pagination: ChannelPaginationInput,
  ) {
    const provider = this.registry.getEngagement(platform)
    if (!provider?.listComments) {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform,
        capability: 'engagement.listComments',
      })
    }
    const input: EngagementListInput = {
      accountId,
      platformWorkId,
      platform,
      credential: await this.getPlatformCredential(userId, accountId, platform),
      pagination: normalizeChannelPagination(
        platform,
        provider.commentPagination,
        pagination,
      ),
    }

    const result = await this.callPlatformProvider(accountId, () => provider.listComments!(input))
    return {
      platform,
      items: result.items,
      pagination: result.pagination,
    }
  }

  async createComment(
    userId: string,
    accountId: string,
    platform: AccountType,
    platformWorkId: string,
    content: string,
    parentCommentId?: string,
  ) {
    const provider = this.registry.getEngagement(platform)
    if (!provider?.createComment) {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform,
        capability: 'engagement.createComment',
      })
    }
    const input: EngagementCommentInput = {
      accountId,
      platformWorkId,
      platform,
      credential: await this.getPlatformCredential(userId, accountId, platform),
      content,
      replyToId: parentCommentId,
    }

    return {
      platform,
      ...await this.callPlatformProvider(accountId, () => provider.createComment!(input)),
    }
  }

  async callFunction(userId: string, accountId: string, body: CallEngagementFunctionBodyDto) {
    const provider = this.registry.getEngagement(body.platform)
    if (!provider) {
      throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
        platform: body.platform,
        capability: 'engagement',
      })
    }

    switch (body.name) {
      case ChannelEngagementFunctionName.DeleteComment: {
        if (!provider.deleteComment) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = DeleteEngagementCommentFunctionDataSchema.parse(body.data)
        const input: EngagementDeleteInput = {
          accountId,
          commentId: data.commentId,
          platform: body.platform,
          credential: await this.getPlatformCredential(userId, accountId, body.platform),
        }
        return { platform: body.platform, ...await this.callPlatformProvider(accountId, () => provider.deleteComment!(input)) }
      }
      case ChannelEngagementFunctionName.Like: {
        if (!provider.like) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = EngagementWorkFunctionDataSchema.parse(body.data)
        const input = await this.toLikeInput(userId, body.platform, data.platformWorkId, accountId)
        return {
          platform: body.platform,
          ...await this.callPlatformProvider(accountId, () => provider.like!(input)),
        }
      }
      case ChannelEngagementFunctionName.Unlike: {
        if (!provider.unlike) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = EngagementWorkFunctionDataSchema.parse(body.data)
        const input = await this.toLikeInput(userId, body.platform, data.platformWorkId, accountId)
        return {
          platform: body.platform,
          ...await this.callPlatformProvider(accountId, () => provider.unlike!(input)),
        }
      }
      case ChannelEngagementFunctionName.Repost: {
        if (!provider.repost) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = EngagementWorkFunctionDataSchema.parse(body.data)
        const input = await this.toLikeInput(userId, body.platform, data.platformWorkId, accountId)
        return {
          platform: body.platform,
          ...await this.callPlatformProvider(accountId, () => provider.repost!(input)),
        }
      }
      case ChannelEngagementFunctionName.UndoRepost: {
        if (!provider.undoRepost) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = EngagementWorkFunctionDataSchema.parse(body.data)
        const input = await this.toLikeInput(userId, body.platform, data.platformWorkId, accountId)
        return {
          platform: body.platform,
          ...await this.callPlatformProvider(accountId, () => provider.undoRepost!(input)),
        }
      }
      case ChannelEngagementFunctionName.Quote: {
        if (!provider.quote) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = QuoteEngagementWorkFunctionDataSchema.parse(body.data)
        const input: EngagementQuoteInput = {
          ...await this.toLikeInput(userId, body.platform, data.platformWorkId, accountId),
          content: data.content,
        }
        return { platform: body.platform, ...await this.callPlatformProvider(accountId, () => provider.quote!(input)) }
      }
      case ChannelEngagementFunctionName.Bookmark: {
        if (!provider.bookmark) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = EngagementWorkFunctionDataSchema.parse(body.data)
        const input = await this.toLikeInput(userId, body.platform, data.platformWorkId, accountId)
        return {
          platform: body.platform,
          ...await this.callPlatformProvider(accountId, () => provider.bookmark!(input)),
        }
      }
      case ChannelEngagementFunctionName.RemoveBookmark: {
        if (!provider.removeBookmark) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = EngagementWorkFunctionDataSchema.parse(body.data)
        const input = await this.toLikeInput(userId, body.platform, data.platformWorkId, accountId)
        return {
          platform: body.platform,
          ...await this.callPlatformProvider(accountId, () => provider.removeBookmark!(input)),
        }
      }
      case ChannelEngagementFunctionName.HideReply: {
        if (!provider.hideReply) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = EngagementCommentFunctionDataSchema.parse(body.data)
        const input = await this.toCommentActionInput(userId, body.platform, data.commentId, accountId)
        return {
          platform: body.platform,
          ...await this.callPlatformProvider(accountId, () => provider.hideReply!(input)),
        }
      }
      case ChannelEngagementFunctionName.UnhideReply: {
        if (!provider.unhideReply) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = EngagementCommentFunctionDataSchema.parse(body.data)
        const input = await this.toCommentActionInput(userId, body.platform, data.commentId, accountId)
        return {
          platform: body.platform,
          ...await this.callPlatformProvider(accountId, () => provider.unhideReply!(input)),
        }
      }
      case ChannelEngagementFunctionName.Follow: {
        if (!provider.follow) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = EngagementAccountFunctionDataSchema.parse(body.data)
        const input = await this.toAccountActionInput(userId, body.platform, data.targetPlatformUid, accountId)
        return {
          platform: body.platform,
          ...await this.callPlatformProvider(accountId, () => provider.follow!(input)),
        }
      }
      case ChannelEngagementFunctionName.Unfollow: {
        if (!provider.unfollow) {
          this.throwUnsupported(body.platform, body.name)
        }
        const data = EngagementAccountFunctionDataSchema.parse(body.data)
        const input = await this.toAccountActionInput(userId, body.platform, data.targetPlatformUid, accountId)
        return {
          platform: body.platform,
          ...await this.callPlatformProvider(accountId, () => provider.unfollow!(input)),
        }
      }
    }
    this.throwUnsupported(body.platform, body.name)
  }

  private throwUnsupported(platform: AccountType, name: ChannelEngagementFunctionName): never {
    throw new AppException(ResponseCode.ChannelPlatformOperationNotSupported, {
      platform,
      capability: `engagement.${name}`,
    })
  }

  private async toLikeInput(
    userId: string,
    platform: AccountType,
    platformWorkId: string,
    accountId: string,
  ): Promise<EngagementLikeInput> {
    return {
      accountId,
      platformWorkId,
      platform,
      credential: await this.getPlatformCredential(userId, accountId, platform),
    }
  }

  private async toCommentActionInput(
    userId: string,
    platform: AccountType,
    commentId: string,
    accountId: string,
  ): Promise<EngagementCommentActionInput> {
    return {
      accountId,
      commentId,
      platform,
      credential: await this.getPlatformCredential(userId, accountId, platform),
    }
  }

  private async toAccountActionInput(
    userId: string,
    platform: AccountType,
    targetPlatformUid: string,
    accountId: string,
  ): Promise<EngagementAccountActionInput> {
    return {
      accountId,
      targetPlatformUid,
      platform,
      credential: await this.getPlatformCredential(userId, accountId, platform),
    }
  }

  private async getPlatformCredential(userId: string, accountId: string, platform: AccountType): Promise<CredentialContext> {
    const account = await this.accountRepository.getByIdAndUserId(accountId, userId)
    if (!account) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    if (account.type !== platform) {
      throw new AppException(ResponseCode.ChannelAuthPlatformMismatch)
    }
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }

    const credential = await this.authService.getValidCredential(accountId, userId)
    return {
      accessToken: credential.accessToken,
      refreshToken: credential.refreshToken,
      platformUid: account.uid,
      account: account.account,
    }
  }

  private async callPlatformProvider<T>(accountId: string, action: () => Promise<T>): Promise<T> {
    try {
      return await action()
    }
    catch (error) {
      await this.authService.markAccountOfflineForCredentialFailure(accountId, error, 'platform_auth_failed')
      throw error
    }
  }
}
