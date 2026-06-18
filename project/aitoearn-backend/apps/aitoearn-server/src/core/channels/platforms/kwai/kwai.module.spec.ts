import type { Provider } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PlatformStatus } from '../platforms.interface'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { KwaiAnalyticsProvider } from './kwai-analytics.provider'
import { KwaiAuthProvider } from './kwai-auth.provider'
import { KwaiPublishProvider } from './kwai-publish.provider'
import { KwaiWorkProvider } from './kwai-work.provider'
import { KwaiConfig } from './kwai.config'
import { KwaiModule } from './kwai.module'

vi.mock('../platforms.registry.module', () => ({
  PlatformRegistryModule: class PlatformRegistryModule {},
}))

vi.mock('../../media/media.service', () => ({
  MediaService: class MediaService {},
}))

vi.mock('@yikart/mongodb', () => ({
  AssetType: {
    AiImage: 'aiImage',
    AiVideo: 'aiVideo',
    AiCard: 'aiCard',
    AiChatImage: 'aiChatImage',
    AideoOutput: 'aideoOutput',
    VideoEdit: 'videoEdit',
    DramaRecap: 'dramaRecap',
    StyleTransfer: 'styleTransfer',
    ImageEdit: 'imageEdit',
    Subtitle: 'subtitle',
    UserMedia: 'userMedia',
    UserFile: 'userFile',
    PublishMedia: 'publishMedia',
    Avatar: 'avatar',
    AgentSession: 'agentSession',
    VideoThumbnail: 'videoThumbnail',
    GooglePlace: 'googlePlace',
    Temp: 'temp',
  },
  PublishRecordRepository: class PublishRecordRepository {},
  PublishStatus: {
    WaitingForPublish: 'waiting_for_publish',
    Queued: 'queued',
    Publishing: 'publishing',
    Published: 'published',
    Failed: 'failed',
  },
}))

vi.mock('@yikart/redis', () => ({
  EventStream: { Channels: 'channels' },
  EventStreamService: class EventStreamService {},
  EventTopic: {
    ChannelsPublishTaskCreated: 'channels.publish.task.created',
    ChannelsPublishTaskPublished: 'channels.publish.task.published',
    ChannelsPublishTaskFailed: 'channels.publish.task.failed',
  },
}))

interface KwaiIntegrationProvider {
  provide: 'KWAI_INTEGRATION'
  inject: unknown[]
  useFactory: (
    registry: PlatformIntegrationRegistry,
    auth: KwaiAuthProvider,
    publish: KwaiPublishProvider,
    work: KwaiWorkProvider,
    analytics: KwaiAnalyticsProvider,
  ) => void
}

function getKwaiIntegrationProvider(providers: Provider[]): KwaiIntegrationProvider {
  const provider = providers.find(candidate =>
    typeof candidate === 'object'
    && candidate !== null
    && 'provide' in candidate
    && candidate.provide === 'KWAI_INTEGRATION',
  )

  return provider as KwaiIntegrationProvider
}

describe('kwai module registration', () => {
  it('registers the Kwai work provider capability', () => {
    const moduleDefinition = KwaiModule.forRoot({
      status: PlatformStatus.Available,
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://api.example.test/kwai/callback',
      logoUrl: 'https://assets.example.test/kwai.svg',
      scopes: ['user_info', 'user_video_publish'],
    } as KwaiConfig)
    const providers = moduleDefinition.providers ?? []

    expect(providers).toContain(KwaiWorkProvider)
    expect(providers).toContain(KwaiAnalyticsProvider)

    const integrationProvider = getKwaiIntegrationProvider(providers)
    expect(integrationProvider.inject).toContain(KwaiWorkProvider)
    expect(integrationProvider.inject).toContain(KwaiAnalyticsProvider)

    const registry = new PlatformIntegrationRegistry()
    const workProvider = new KwaiWorkProvider({} as never)
    const analyticsProvider = {} as KwaiAnalyticsProvider
    integrationProvider.useFactory(
      registry,
      {} as KwaiAuthProvider,
      {} as KwaiPublishProvider,
      workProvider,
      analyticsProvider,
    )

    expect(registry.get(AccountType.Kwai).work).toBe(workProvider)
    expect(registry.get(AccountType.Kwai).analytics).toBe(analyticsProvider)
    expect(registry.listMetadata()[0]?.capabilities.work.getLinkInfo).toBe(true)
    expect(registry.listMetadata()[0]?.capabilities.work.listWorksPagination).toMatchObject({
      mode: 'cursor',
      defaultLimit: 20,
      maxLimit: 200,
      supportsPrevious: false,
    })
    expect(registry.listMetadata()[0]?.capabilities.analytics.account).toBe(true)
  })
})
