import type { AccountType } from '@yikart/common'
import { IntentClassifier, IntentLevel, NurtureStage, NurtureStateMachine } from '../nurture'
import { ServerRedisKeys, ServerRedisService } from '../../common/redis'

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
import { AuthService } from '../auth/auth.service'
import { normalizeChannelPagination } from '../platforms/platform-pagination.helper'
import { ChannelEngagementFunctionName } from '../platforms/platforms.interface'
import { PlatformIntegrationRegistry } from '../platforms/platforms.registry'
import { RelayAccountException } from '../relay/relay-account.exception'
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
    private readonly intentClassifier: IntentClassifier,
    private readonly redis: ServerRedisService,
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


  // ═══════════════════════════════════════════════════════════
  // 养号状态机集成
  // ═══════════════════════════════════════════════════════════

  /**
   * 获取或初始化账户的养号上下文
   * 从 Redis 读取状态，不存在则创建默认 COLD 状态
   */
  private async getNurtureContext(accountId: string, platform: AccountType): Promise<{
    context: {
      accountId: string
      platform: AccountType
      registeredAt: Date
      currentStage: string
      todayCounts: { publish: number; engagement: number; comments: number }
    }
    isNew: boolean
  }> {
    const stateKey = ServerRedisKeys.nurtureAccountState(accountId)
    const cached = await this.redis.getChannelAuthSession<any>(stateKey)

    const now = new Date()
    const registeredAt = cached?.registeredAt ? new Date(cached.registeredAt) : now

    const ctx = {
      accountId,
      platform,
      registeredAt,
      currentStage: cached?.currentStage ?? NurtureStateMachine.inferStage(registeredAt),
      todayCounts: cached?.todayCounts ?? { publish: 0, engagement: 0, comments: 0 },
    }

    // 如果是新账户（无缓存），初始化为 COLD
    const isNew = !cached
    if (isNew) {
      ctx.currentStage = NurtureStage.COLD
      ctx.registeredAt = now
    }

    return { context: ctx, isNew }
  }

  /**
   * 检查评论动作是否受养号状态机允许
   */
  private async checkNurtureForComment(
    accountId: string,
    platform: AccountType,
  ): Promise<{ allowed: boolean; reason?: string; stage: string }> {
    const { context } = await this.getNurtureContext(accountId, platform)

    const result = NurtureStateMachine.checkAction(context as any, 'comment')
    if (!result.allowed) {
      return { allowed: false, reason: result.reason, stage: result.stage }
    }

    return { allowed: true, stage: result.stage }
  }

  /**
   * 保存养号上下文到 Redis
   */
  private async saveNurtureContext(
    accountId: string,
    context: {
      registeredAt: Date
      currentStage: string
      todayCounts: { publish: number; engagement: number; comments: number }
    },
  ): Promise<void> {
    const stateKey = ServerRedisKeys.nurtureAccountState(accountId)
    await this.redis.saveChannelAuthSession(stateKey, context, 60 * 60 * 24) // 24h TTL
  }

  /**
   * LLM 意图分类：判断评论是否值得回复
   * 高意向 → 走私信触发；中意向 → 仅回评；无效 → 忽略
   */
  private async classifyCommentIntent(comment: string): Promise<{
    level: IntentLevel
    confidence: number
    shouldReply: boolean
    shouldDm: boolean
  }> {
    const classification = await this.intentClassifier.classify(comment)

    return {
      level: classification.level,
      confidence: classification.confidence,
      shouldReply: classification.level !== IntentLevel.INVALID,
      shouldDm: classification.level === IntentLevel.HIGH,
    }
  }
}
