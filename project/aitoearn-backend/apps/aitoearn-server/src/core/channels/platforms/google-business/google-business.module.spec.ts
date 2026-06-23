import type { Provider } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PlatformStatus } from '../platforms.interface'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { GoogleBusinessAuthProvider } from './google-business-auth.provider'
import { GoogleBusinessConfig } from './google-business.config'
import { GoogleBusinessModule } from './google-business.module'

vi.mock('../platforms.registry.module', () => ({
  PlatformRegistryModule: class PlatformRegistryModule {},
}))

interface GoogleBusinessIntegrationProvider {
  provide: 'GOOGLE_BUSINESS_INTEGRATION'
  inject: unknown[]
  useFactory: (
    registry: PlatformIntegrationRegistry,
    auth: GoogleBusinessAuthProvider,
  ) => void
}

function getGoogleBusinessIntegrationProvider(providers: Provider[]): GoogleBusinessIntegrationProvider {
  const provider = providers.find(candidate =>
    typeof candidate === 'object'
    && candidate !== null
    && 'provide' in candidate
    && candidate.provide === 'GOOGLE_BUSINESS_INTEGRATION',
  )

  return provider as GoogleBusinessIntegrationProvider
}

describe('google business module registration', () => {
  it('registers only auth capabilities for available Google Business config', () => {
    const moduleDefinition = GoogleBusinessModule.forRoot({
      status: PlatformStatus.Available,
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://api.example.test/google-business/callback',
      logoUrl: 'https://assets.example.test/google-business.svg',
      scopes: ['https://www.googleapis.com/auth/business.manage'],
    } as GoogleBusinessConfig)
    const providers = moduleDefinition.providers ?? []
    const integrationProvider = getGoogleBusinessIntegrationProvider(providers)

    expect(integrationProvider.inject).toEqual([
      PlatformIntegrationRegistry,
      GoogleBusinessAuthProvider,
    ])

    const registry = new PlatformIntegrationRegistry()
    const authProvider = {
      revoke: async () => undefined,
      listSelectableAccounts: async () => [],
    } as GoogleBusinessAuthProvider
    integrationProvider.useFactory(registry, authProvider)

    const integration = registry.get(AccountType.GoogleBusiness)
    const metadata = registry.listMetadata()[0]

    expect(integration.auth).toBe(authProvider)
    expect(integration.publish).toBeUndefined()
    expect(integration.analytics).toBeUndefined()
    expect(integration.engagement).toBeUndefined()
    expect(integration.work).toBeUndefined()
    expect(integration.webhook).toBeUndefined()
    expect(metadata?.capabilities).toMatchObject({
      auth: {
        supported: true,
        revoke: true,
        selectableAccounts: true,
        refreshAccountAccess: false,
      },
      publish: {
        supported: false,
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
      },
      webhook: {
        supported: false,
      },
    })
  })
})
