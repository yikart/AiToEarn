import type { Provider } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { CompletionStrategy, PlatformStatus } from '../platforms.interface'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { LinkedInAuthProvider } from './linkedin-auth.provider'
import { LinkedInPublishProvider } from './linkedin-publish.provider'
import { LinkedInWebhookProvider } from './linkedin-webhook.provider'
import { LinkedinConfig } from './linkedin.config'
import { LinkedinModule } from './linkedin.module'

vi.mock('../platforms.registry.module', () => ({
  PlatformRegistryModule: class PlatformRegistryModule {},
}))

vi.mock('../../media/media.service', () => ({
  MediaService: class MediaService {},
}))

interface LinkedInIntegrationProvider {
  provide: 'LINKEDIN_INTEGRATION'
  inject: unknown[]
  useFactory: (
    registry: PlatformIntegrationRegistry,
    auth: LinkedInAuthProvider,
    publish: LinkedInPublishProvider,
    webhook: LinkedInWebhookProvider,
  ) => void
}

function getLinkedInIntegrationProvider(providers: Provider[]): LinkedInIntegrationProvider {
  const provider = providers.find(candidate =>
    typeof candidate === 'object'
    && candidate !== null
    && 'provide' in candidate
    && candidate.provide === 'LINKEDIN_INTEGRATION',
  )

  return provider as LinkedInIntegrationProvider
}

describe('linkedin module registration', () => {
  it('registers auth and publish without data or work capabilities', () => {
    const moduleDefinition = LinkedinModule.forRoot({
      status: PlatformStatus.Available,
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://api.example.test/linkedin/callback',
      logoUrl: 'https://assets.example.test/linkedin.svg',
      restVersion: '202605',
      scopes: ['openid', 'profile', 'email', 'w_member_social'],
      webhookSecret: '',
    } as LinkedinConfig)
    const providers = moduleDefinition.providers ?? []
    const providerNames = providers.map(provider => (
      typeof provider === 'function'
        ? provider.name
        : typeof provider === 'object' && provider !== null && 'provide' in provider
          ? String(provider.provide)
          : ''
    ))

    expect(providerNames).not.toContain('LinkedInAnalyticsProvider')
    expect(providerNames).not.toContain('LinkedInWorkProvider')
    expect(providerNames).not.toContain('LinkedInEngagementProvider')

    const integrationProvider = getLinkedInIntegrationProvider(providers)
    expect(integrationProvider.inject).toEqual([
      PlatformIntegrationRegistry,
      LinkedInAuthProvider,
      LinkedInPublishProvider,
      LinkedInWebhookProvider,
    ])

    const registry = new PlatformIntegrationRegistry()
    const publishProvider = {
      publish: async () => ({ status: 200 }),
      cancel: async () => ({ canceled: false }),
    } as LinkedInPublishProvider
    integrationProvider.useFactory(
      registry,
      {} as LinkedInAuthProvider,
      publishProvider,
      {} as LinkedInWebhookProvider,
    )

    const integration = registry.get(AccountType.LinkedIn)
    const metadata = registry.listMetadata()[0]

    expect(integration.publish).toBe(publishProvider)
    expect(integration.analytics).toBeUndefined()
    expect(integration.engagement).toBeUndefined()
    expect(integration.work).toBeUndefined()
    expect(metadata?.mediaRules.videoFormats).toEqual(['mp4'])
    expect(metadata?.capabilities).toMatchObject({
      publish: {
        supported: true,
        verify: false,
        completionStrategy: CompletionStrategy.Sync,
      },
      analytics: {
        account: false,
        work: false,
      },
      engagement: {
        comments: {
          list: {
            supported: false,
          },
          create: {
            supported: false,
          },
        },
        functions: [],
      },
      work: {
        listWorks: false,
        getLinkInfo: false,
        getDetail: false,
        verifyOwnership: false,
      },
    })
  })
})
