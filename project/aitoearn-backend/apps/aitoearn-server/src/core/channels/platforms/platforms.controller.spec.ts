import type { PlatformIntegration } from './platforms.interface'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { BILIBILI_METADATA } from './bilibili/bilibili.constants'
import { DOUYIN_METADATA } from './douyin/douyin.constants'
import { FACEBOOK_METADATA } from './facebook/facebook.constants'
import { INSTAGRAM_METADATA } from './instagram/instagram.constants'
import { KWAI_METADATA } from './kwai/kwai.constants'
import { PlatformsController } from './platforms.controller'
import { AuthType, ChannelEngagementFunctionName, ChannelEngagementTargetType, ChannelPaginationMode, ChannelWorkAnalyticsDataSource, CompletionStrategy, EditorType, PlatformStatus, PublishContentMode } from './platforms.interface'
import { PlatformIntegrationRegistry } from './platforms.registry'
import { RedNotePublishProvider } from './rednote/rednote-publish.provider'
import { REDNOTE_METADATA } from './rednote/rednote.constants'
import { THREADS_METADATA } from './threads/threads.constants'
import { TIKTOK_METADATA } from './tiktok/tiktok.constants'
import { TWITTER_METADATA } from './twitter/twitter.constants'
import { WECHAT_CHANNELS_METADATA } from './wechat/wechat-channels/wechat-channels.constants'
import { YOUTUBE_METADATA } from './youtube/youtube.constants'

vi.mock('@yikart/mongodb', () => ({
  AccountGroupRepository: class AccountGroupRepository {},
  AccountRepository: class AccountRepository {},
  OAuth2CredentialRepository: class OAuth2CredentialRepository {},
}))

vi.mock('./platforms.service', () => ({
  PlatformsService: class PlatformsService {},
}))

function createController(registry: PlatformIntegrationRegistry) {
  return new PlatformsController(registry, {} as never)
}

function createTwitterIntegration(): PlatformIntegration {
  return {
    platform: AccountType.Twitter,
    metadata: {
      platform: AccountType.Twitter,
      displayName: { 'en-US': 'X / Twitter', 'zh-CN': 'X / Twitter' },
      logoUrl: 'https://cdn.aitoearn.com/platforms/twitter.svg',
      authType: AuthType.OAuth2,
      authInstructions: {
        'en-US': 'Continue in the X / Twitter authorization window.',
        'zh-CN': '请在 X / Twitter 授权窗口中继续操作。',
      },
      editor: EditorType.Text,
      contentLimits: { modes: [PublishContentMode.Text, PublishContentMode.ImageText, PublishContentMode.Video] },
      mediaRules: {},
      topic: { supported: true },
      publishPolicy: {
        completionStrategy: CompletionStrategy.Sync,
        scheduleByPlatform: false,
        updateSupported: true,
      },
      optionSchema: z.object({}),
    },
    runtime: {},
    auth: {
      generateAuthUrl: async input => ({ url: 'https://x.com/oauth', state: input.state, redirectUri: 'https://api.example.test/callback' }),
      exchangeCode: async () => ({ accessToken: 'access-token' }),
      refresh: async () => ({ accessToken: 'access-token' }),
      revoke: async () => undefined,
      getProfile: async () => ({ platformUid: 'user-id', displayName: 'User' }),
      listSelectableAccounts: async () => [],
      refreshAccountAccess: async () => ({
        platform: AccountType.Twitter,
        platformUid: 'user-id',
        displayName: 'User',
      }),
    },
    publish: {
      platform: AccountType.Twitter,
      validate: async () => ({ valid: true }),
      normalize: async input => ({ content: input.content, option: input.option }),
      publish: async () => ({ status: 200 }),
      cancel: async () => ({ canceled: true }),
      update: async () => ({ status: 200 }),
      verify: async () => ({ published: true }),
    },
    analytics: {
      fetchAccountAnalytics: async () => ({}),
    },
    engagement: {
      like: async () => undefined,
      unlike: async () => undefined,
    },
    work: {
      getDetail: async () => ({}),
      verifyOwnership: async () => true,
    },
    webhook: {
      handle: async () => undefined,
    },
  }
}

describe('platforms controller', () => {
  it('declares post insight crawler work analytics in supported platform metadata', () => {
    const crawlerPlatforms = [
      REDNOTE_METADATA,
      DOUYIN_METADATA,
      KWAI_METADATA,
      TIKTOK_METADATA,
      YOUTUBE_METADATA,
      INSTAGRAM_METADATA,
      FACEBOOK_METADATA,
      TWITTER_METADATA,
      THREADS_METADATA,
    ]

    expect(crawlerPlatforms.map(item => item.platform)).toEqual([
      AccountType.RedNote,
      AccountType.Douyin,
      AccountType.Kwai,
      AccountType.TikTok,
      AccountType.YouTube,
      AccountType.Instagram,
      AccountType.Facebook,
      AccountType.Twitter,
      AccountType.Threads,
    ])
    for (const metadata of crawlerPlatforms) {
      expect(metadata.analytics?.work?.dataSources).toContain(ChannelWorkAnalyticsDataSource.PostInsightCrawler)
    }
    expect(BILIBILI_METADATA.analytics?.work?.dataSources ?? []).not.toContain(ChannelWorkAnalyticsDataSource.PostInsightCrawler)
  })

  it('marks webhook entry as public for external callbacks', () => {
    const metadataKeys = Reflect.getMetadataKeys(PlatformsController.prototype.handleWebhook)
    const publicKey = metadataKeys.find((key): key is symbol =>
      typeof key === 'symbol' && key.description === 'is_public',
    )

    expect(publicKey).toBeDefined()
    expect(Reflect.getMetadata(publicKey!, PlatformsController.prototype.handleWebhook)).toBe(true)
  })

  it('returns capabilities from registered providers', () => {
    const registry = new PlatformIntegrationRegistry()
    registry.register(createTwitterIntegration())

    const result = createController(registry).listPlatforms()
    const twitter = result.find(platform => platform.platform === AccountType.Twitter)

    expect(twitter?.capabilities).toMatchObject({
      auth: {
        supported: true,
        revoke: true,
        selectableAccounts: true,
        refreshAccountAccess: true,
      },
      publish: {
        supported: true,
        cancel: true,
        update: true,
        verify: true,
        finalize: false,
        scheduleByPlatform: false,
        completionStrategy: CompletionStrategy.Sync,
      },
      analytics: {
        account: true,
        work: false,
      },
      engagement: {
        comments: {
          list: {
            supported: false,
            pagination: { mode: ChannelPaginationMode.None },
          },
          create: {
            supported: false,
          },
        },
        functions: [
          {
            name: ChannelEngagementFunctionName.Like,
            target: ChannelEngagementTargetType.Work,
          },
          {
            name: ChannelEngagementFunctionName.Unlike,
            target: ChannelEngagementTargetType.Work,
          },
        ],
      },
      work: {
        listWorks: false,
        listWorksPagination: { mode: ChannelPaginationMode.None },
        getLinkInfo: false,
        getDetail: true,
        verifyOwnership: true,
      },
      browse: {
        search: false,
        getDetail: false,
      },
      webhook: {
        supported: true,
      },
    })
    expect(twitter?.contentLimits.modes).toEqual([
      PublishContentMode.Text,
      PublishContentMode.ImageText,
      PublishContentMode.Video,
    ])
    expect(twitter?.authInstructions).toEqual({
      'en-US': 'Continue in the X / Twitter authorization window.',
      'zh-CN': '请在 X / Twitter 授权窗口中继续操作。',
    })
    expect(twitter?.capabilities.engagement.comments.list.parameters.querySchema).toMatchObject({
      properties: {
        accountId: expect.any(Object),
        platform: expect.any(Object),
        platformWorkId: expect.any(Object),
        pagination: expect.any(Object),
      },
    })
    expect(twitter?.capabilities.engagement.functions.find(item => item.name === ChannelEngagementFunctionName.Like)?.parameters).toMatchObject({
      querySchema: {
        properties: {
          accountId: expect.any(Object),
        },
      },
      bodySchema: {
        properties: {
          platform: expect.any(Object),
          name: expect.any(Object),
          data: expect.any(Object),
        },
      },
      dataSchema: {
        properties: {
          platformWorkId: expect.any(Object),
        },
      },
    })
  })

  it('uses metadata cache created during platform registration', () => {
    const registry = new PlatformIntegrationRegistry()
    const integration = createTwitterIntegration()
    registry.register(integration)
    if (integration.engagement) {
      delete integration.engagement.like
    }

    const result = createController(registry).listPlatforms()
    const twitter = result.find(platform => platform.platform === AccountType.Twitter)

    expect(twitter?.capabilities.engagement.functions.some(item => item.name === ChannelEngagementFunctionName.Like)).toBe(true)
  })

  it('keeps public empty account hints from platform metadata', () => {
    const registry = new PlatformIntegrationRegistry()
    registry.register({
      platform: AccountType.Facebook,
      metadata: { ...FACEBOOK_METADATA, logoUrl: 'https://assets.aitoearn.ai/platforms/facebook.svg' },
      runtime: {},
      auth: {
        generateAuthUrl: async input => ({ url: 'https://facebook.com/oauth', state: input.state, redirectUri: 'https://api.example.test/callback' }),
        exchangeCode: async () => ({ accessToken: 'access-token' }),
        refresh: async () => ({ accessToken: 'access-token' }),
        getProfile: async () => ({ platformUid: 'page-1', displayName: 'Page' }),
      },
    })

    const result = createController(registry).listPlatforms()
    const facebook = result.find(platform => platform.platform === AccountType.Facebook)

    expect(facebook?.emptyAccountHint).toEqual(FACEBOOK_METADATA.emptyAccountHint)
  })

  it('marks RedNote as plugin auth and exposes its publish provider capability', () => {
    const registry = new PlatformIntegrationRegistry()
    const publish = new RedNotePublishProvider()
    registry.register({
      platform: AccountType.RedNote,
      metadata: { ...REDNOTE_METADATA, logoUrl: 'https://assets.aitoearn.ai/platforms/rednote.svg' },
      runtime: {},
      publish,
    })

    const result = createController(registry).listPlatforms()
    const rednote = result.find(platform => platform.platform === AccountType.RedNote)

    expect(rednote?.authType).toBe(AuthType.Plugin)
    expect(rednote?.contentLimits.modes).toEqual([
      PublishContentMode.ImageText,
      PublishContentMode.Video,
    ])
    expect(rednote?.capabilities.publish).toMatchObject({
      supported: true,
      cancel: false,
      update: false,
      verify: false,
      finalize: false,
      scheduleByPlatform: false,
      completionStrategy: CompletionStrategy.Sync,
    })
    expect(rednote?.capabilities.analytics).toEqual({
      account: false,
      work: true,
    })
    expect(rednote?.capabilities.analytics).not.toHaveProperty('workDataSources')
    expect(rednote).not.toHaveProperty('analytics')
    expect(rednote?.capabilities.engagement).toMatchObject({
      comments: {
        list: {
          supported: false,
          pagination: { mode: ChannelPaginationMode.None },
        },
        create: {
          supported: false,
        },
      },
      functions: [],
    })
  })

  it('marks WeChat Channels as plugin auth and exposes its work capability', () => {
    const registry = new PlatformIntegrationRegistry()
    registry.register({
      platform: AccountType.WeChatChannels,
      metadata: { ...WECHAT_CHANNELS_METADATA, logoUrl: 'https://assets.aitoearn.ai/platforms/wechat-channels.svg' },
      runtime: {},
      work: {
        getLinkInfo: async () => ({}),
      } as never,
    })

    const result = createController(registry).listPlatforms()
    const wechatChannels = result.find(platform => platform.platform === AccountType.WeChatChannels)

    expect(wechatChannels?.authType).toBe(AuthType.Plugin)
    expect(wechatChannels?.capabilities.auth.supported).toBe(false)
    expect(wechatChannels?.capabilities.work.getLinkInfo).toBe(true)
  })

  it('returns placeholder metadata with empty capabilities for non-available platforms', () => {
    const registry = new PlatformIntegrationRegistry()
    registry.register({
      platform: AccountType.RedNote,
      status: PlatformStatus.ComingSoon,
      metadata: { ...REDNOTE_METADATA, logoUrl: 'https://assets.aitoearn.ai/platforms/rednote.svg' },
      runtime: {},
    })

    const result = createController(registry).listPlatforms()
    const rednote = result.find(platform => platform.platform === AccountType.RedNote)

    expect(rednote?.status).toBe(PlatformStatus.ComingSoon)
    expect(rednote?.logoUrl).toBe('https://assets.aitoearn.ai/platforms/rednote.svg')
    expect(rednote?.capabilities).toMatchObject({
      auth: { supported: false, revoke: false, selectableAccounts: false, refreshAccountAccess: false },
      publish: { supported: false, cancel: false, update: false, verify: false, finalize: false, scheduleByPlatform: false, optionSources: false },
      analytics: { account: false, work: false },
      engagement: {
        comments: {
          list: {
            supported: false,
            pagination: { mode: ChannelPaginationMode.None },
          },
          create: {
            supported: false,
          },
        },
        functions: [],
      },
      work: { listWorks: false, listWorksPagination: { mode: ChannelPaginationMode.None }, getLinkInfo: false, getDetail: false, verifyOwnership: false },
      browse: { search: false, getDetail: false },
      webhook: { supported: false },
    })
  })

  it('rejects hidden, duplicate, and provider-less available registrations', () => {
    const registry = new PlatformIntegrationRegistry()
    const metadata = { ...REDNOTE_METADATA, logoUrl: 'https://assets.aitoearn.ai/platforms/rednote.svg' }
    const { analytics: _analytics, ...metadataWithoutAnalytics } = metadata

    expect(() => registry.register({
      platform: AccountType.RedNote,
      status: PlatformStatus.Hidden,
      metadata,
      runtime: {},
    })).toThrow()
    expect(() => registry.register({
      platform: AccountType.GoogleBusiness,
      status: PlatformStatus.Available,
      metadata: { ...metadataWithoutAnalytics, platform: AccountType.GoogleBusiness },
      runtime: {},
    })).toThrow()

    registry.register({
      platform: AccountType.RedNote,
      status: PlatformStatus.ComingSoon,
      metadata,
      runtime: {},
    })
    expect(() => registry.register({
      platform: AccountType.RedNote,
      status: PlatformStatus.ComingSoon,
      metadata,
      runtime: {},
    })).toThrow()
  })
})
