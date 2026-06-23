import { Injectable, Logger } from '@nestjs/common'
import { AccountType, AppException, ResponseCode, zodToJsonSchemaOptions } from '@yikart/common'
import { z } from 'zod'
import {
  CallEngagementFunctionBodySchema,
  CreateEngagementCommentBodySchema,
  EngagementCommentsQuerySchema,
  EngagementExecutionQuerySchema,
  getEngagementFunctionDataSchema,
} from '../engagement/engagement.dto'
import {
  AnalyticsProvider,
  AuthProvider,
  BrowseProvider,
  CachedPlatformMetadata,
  ChannelEngagementFunctionName,
  ChannelEngagementTargetType,
  ChannelPaginationMode,
  ChannelWorkAnalyticsDataSource,
  EngagementProvider,
  PlatformIntegration,
  PlatformStatus,
  PlatformWebhookHandler,
  PublishOptionSourceProvider,
  PublishProvider,
  WorkProvider,
} from './platforms.interface'

interface RegisteredPlatform<TOption = any, TDataOption = any> {
  integration: PlatformIntegration<TOption, TDataOption>
  metadata: CachedPlatformMetadata
}

@Injectable()
export class PlatformIntegrationRegistry {
  private readonly logger = new Logger(PlatformIntegrationRegistry.name)
  private readonly platforms = new Map<AccountType, RegisteredPlatform>()

  register<TOption, TDataOption>(integration: PlatformIntegration<TOption, TDataOption>): void {
    const status = integration.status ?? PlatformStatus.Available
    if (status === PlatformStatus.Hidden) {
      throw new Error('Hidden platforms are not registered')
    }
    if (status === PlatformStatus.Available && !this.hasCapabilityProvider(integration)) {
      throw new Error(`Available platform must register at least one capability provider: ${integration.platform}`)
    }
    if (this.platforms.has(integration.platform)) {
      throw new Error(`Platform already registered: ${integration.platform}`)
    }
    this.platforms.set(integration.platform, {
      integration,
      metadata: this.createMetadataCache(integration),
    })
    this.logger.log({ platform: integration.platform }, 'Registered platform')
  }

  get(platform: AccountType): PlatformIntegration {
    const registeredPlatform = this.platforms.get(platform)
    if (!registeredPlatform) {
      this.logger.warn({ platform }, 'Platform not registered')
      throw new AppException(ResponseCode.PlatformNotSupported, { platform })
    }
    return registeredPlatform.integration
  }

  getAuth(platform: AccountType): AuthProvider {
    const integration = this.get(platform)
    if (!integration.auth) {
      this.logger.warn({ platform }, 'Platform does not support auth')
      throw new AppException(ResponseCode.PlatformNotSupported, { platform, capability: 'auth' })
    }
    return integration.auth
  }

  getPublish(platform: AccountType): PublishProvider {
    const integration = this.get(platform)
    if (!integration.publish) {
      this.logger.warn({ platform }, 'Platform does not support publish')
      throw new AppException(ResponseCode.ChannelPublishPlatformNotSupported, { platform })
    }
    return integration.publish
  }

  getPublishOptions(platform: AccountType): PublishOptionSourceProvider | undefined {
    const integration = this.get(platform)
    return integration.publishOptions
  }

  getAnalytics(platform: AccountType): AnalyticsProvider | undefined {
    const integration = this.get(platform)
    return integration.analytics
  }

  getEngagement(platform: AccountType): EngagementProvider | undefined {
    const integration = this.get(platform)
    return integration.engagement
  }

  getBrowse(platform: AccountType): BrowseProvider | undefined {
    const integration = this.get(platform)
    return integration.browse
  }

  getWork(platform: AccountType): WorkProvider | undefined {
    const integration = this.get(platform)
    return integration.work
  }

  hasWorkAnalyticsDataSource(platform: AccountType, dataSource: ChannelWorkAnalyticsDataSource): boolean {
    return this.listWorkAnalyticsDataSources(this.get(platform)).includes(dataSource)
  }

  getWebhook(platform: AccountType): PlatformWebhookHandler | undefined {
    const integration = this.get(platform)
    return integration.webhook
  }

  listMetadata(): CachedPlatformMetadata[] {
    return Array.from(this.platforms.values()).map(platform => platform.metadata)
  }

  listIntegrations(): PlatformIntegration[] {
    return Array.from(this.platforms.values()).map(platform => platform.integration)
  }

  has(platform: AccountType): boolean {
    return this.platforms.has(platform)
  }

  private createMetadataCache<TOption, TDataOption>(integration: PlatformIntegration<TOption, TDataOption>): CachedPlatformMetadata {
    const publishPolicy = integration.metadata.publishPolicy
    const publishSupported = Boolean(integration.publish && publishPolicy)
    const status = integration.status ?? PlatformStatus.Available

    return {
      ...integration.metadata,
      status,
      capabilities: status === PlatformStatus.Available
        ? {
            auth: {
              supported: Boolean(integration.auth),
              revoke: Boolean(integration.auth?.revoke),
              selectableAccounts: Boolean(integration.auth?.listSelectableAccounts),
              refreshAccountAccess: Boolean(integration.auth?.refreshAccountAccess),
            },
            publish: {
              supported: publishSupported,
              cancel: Boolean(publishSupported && integration.publish?.cancel),
              update: Boolean(publishSupported && publishPolicy?.updateSupported && integration.publish?.update),
              verify: Boolean(publishSupported && integration.publish?.verify),
              finalize: Boolean(publishSupported && integration.publish?.finalize),
              scheduleByPlatform: Boolean(publishSupported && publishPolicy?.scheduleByPlatform),
              optionSources: Boolean(integration.publishOptions),
              completionStrategy: publishSupported ? publishPolicy?.completionStrategy : undefined,
            },
            analytics: this.createAnalyticsCapabilities(integration),
            engagement: this.createEngagementCapabilities(integration.engagement),
            work: {
              listWorks: Boolean(integration.work?.listWorks),
              listWorksPagination: integration.work?.listWorksPagination ?? { mode: ChannelPaginationMode.None },
              getLinkInfo: Boolean(integration.work?.getLinkInfo),
              getDetail: Boolean(integration.work?.getDetail),
              verifyOwnership: Boolean(integration.work?.verifyOwnership),
            },
            browse: {
              search: Boolean(integration.browse?.search),
              getDetail: Boolean(integration.browse?.getDetail),
            },
            webhook: {
              supported: Boolean(integration.webhook),
            },
          }
        : {
            auth: { supported: false, revoke: false, selectableAccounts: false, refreshAccountAccess: false },
            publish: { supported: false, cancel: false, update: false, verify: false, finalize: false, scheduleByPlatform: false, optionSources: false },
            analytics: { account: false, work: false },
            engagement: this.createEngagementCapabilities(undefined),
            work: { listWorks: false, listWorksPagination: { mode: ChannelPaginationMode.None }, getLinkInfo: false, getDetail: false, verifyOwnership: false },
            browse: { search: false, getDetail: false },
            webhook: { supported: false },
          },
      optionSchema: z.toJSONSchema(integration.metadata.optionSchema, {
        ...zodToJsonSchemaOptions,
        io: 'input',
      }) as Record<string, unknown>,
    }
  }

  private createEngagementCapabilities(provider: EngagementProvider | undefined) {
    const querySchema = this.toJsonSchema(EngagementExecutionQuerySchema)
    const bodySchema = this.toJsonSchema(CallEngagementFunctionBodySchema)

    return {
      comments: {
        list: {
          supported: Boolean(provider?.listComments),
          pagination: provider?.commentPagination ?? { mode: ChannelPaginationMode.None },
          parameters: {
            querySchema: this.toJsonSchema(EngagementCommentsQuerySchema),
          },
        },
        create: {
          supported: Boolean(provider?.createComment),
          parameters: {
            querySchema,
            bodySchema: this.toJsonSchema(CreateEngagementCommentBodySchema),
          },
        },
      },
      functions: [
        {
          name: ChannelEngagementFunctionName.DeleteComment,
          label: { 'en-US': 'Delete comment', 'zh-CN': '删除评论' },
          target: ChannelEngagementTargetType.Comment,
          supported: Boolean(provider?.deleteComment),
        },
        {
          name: ChannelEngagementFunctionName.Like,
          label: { 'en-US': 'Like work', 'zh-CN': '点赞作品' },
          target: ChannelEngagementTargetType.Work,
          supported: Boolean(provider?.like),
        },
        {
          name: ChannelEngagementFunctionName.Unlike,
          label: { 'en-US': 'Unlike work', 'zh-CN': '取消点赞' },
          target: ChannelEngagementTargetType.Work,
          supported: Boolean(provider?.unlike),
        },
        {
          name: ChannelEngagementFunctionName.Repost,
          label: { 'en-US': 'Repost work', 'zh-CN': '转发作品' },
          target: ChannelEngagementTargetType.Work,
          supported: Boolean(provider?.repost),
        },
        {
          name: ChannelEngagementFunctionName.UndoRepost,
          label: { 'en-US': 'Undo repost', 'zh-CN': '取消转发' },
          target: ChannelEngagementTargetType.Work,
          supported: Boolean(provider?.undoRepost),
        },
        {
          name: ChannelEngagementFunctionName.Quote,
          label: { 'en-US': 'Quote work', 'zh-CN': '引用作品' },
          target: ChannelEngagementTargetType.Work,
          supported: Boolean(provider?.quote),
        },
        {
          name: ChannelEngagementFunctionName.Bookmark,
          label: { 'en-US': 'Bookmark work', 'zh-CN': '收藏作品' },
          target: ChannelEngagementTargetType.Work,
          supported: Boolean(provider?.bookmark),
        },
        {
          name: ChannelEngagementFunctionName.RemoveBookmark,
          label: { 'en-US': 'Remove bookmark', 'zh-CN': '移除收藏' },
          target: ChannelEngagementTargetType.Work,
          supported: Boolean(provider?.removeBookmark),
        },
        {
          name: ChannelEngagementFunctionName.HideReply,
          label: { 'en-US': 'Hide reply', 'zh-CN': '隐藏回复' },
          target: ChannelEngagementTargetType.Comment,
          supported: Boolean(provider?.hideReply),
        },
        {
          name: ChannelEngagementFunctionName.UnhideReply,
          label: { 'en-US': 'Unhide reply', 'zh-CN': '取消隐藏回复' },
          target: ChannelEngagementTargetType.Comment,
          supported: Boolean(provider?.unhideReply),
        },
        {
          name: ChannelEngagementFunctionName.Follow,
          label: { 'en-US': 'Follow account', 'zh-CN': '关注账号' },
          target: ChannelEngagementTargetType.Account,
          supported: Boolean(provider?.follow),
        },
        {
          name: ChannelEngagementFunctionName.Unfollow,
          label: { 'en-US': 'Unfollow account', 'zh-CN': '取消关注账号' },
          target: ChannelEngagementTargetType.Account,
          supported: Boolean(provider?.unfollow),
        },
      ]
        .filter(item => item.supported)
        .map(item => ({
          name: item.name,
          label: item.label,
          target: item.target,
          parameters: {
            querySchema,
            bodySchema,
            dataSchema: this.toJsonSchema(getEngagementFunctionDataSchema(item.name)),
          },
        })),
    }
  }

  private createAnalyticsCapabilities<TOption, TDataOption>(integration: PlatformIntegration<TOption, TDataOption>) {
    return {
      account: Boolean(integration.analytics),
      work: this.listWorkAnalyticsDataSources(integration).length > 0,
    }
  }

  private listWorkAnalyticsDataSources<TOption, TDataOption>(integration: PlatformIntegration<TOption, TDataOption>) {
    const sources = new Set(integration.metadata.analytics?.work?.dataSources ?? [])
    if (integration.analytics?.fetchWorkAnalytics) {
      sources.add(ChannelWorkAnalyticsDataSource.Official)
    }
    return [...sources]
  }

  private toJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
    return z.toJSONSchema(schema, {
      ...zodToJsonSchemaOptions,
      io: 'input',
    }) as Record<string, unknown>
  }

  private hasCapabilityProvider<TOption, TDataOption>(integration: PlatformIntegration<TOption, TDataOption>): boolean {
    return Boolean(
      integration.auth
      || integration.publish
      || integration.publishOptions
      || integration.analytics
      || Boolean(integration.metadata.analytics?.work?.dataSources.length)
      || integration.engagement
      || integration.browse
      || integration.work
      || integration.webhook,
    )
  }
}
