import type { DynamicModule } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PlatformStatus } from '../platforms.interface'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { RedNoteModule } from './rednote.module'

vi.mock('../platforms.registry.module', () => ({
  PlatformRegistryModule: class PlatformRegistryModule {},
}))

vi.mock('@yikart/assets', () => ({
  VideoMetadataService: class VideoMetadataService {},
}))

vi.mock('@yikart/mongodb', () => ({
  AccountGroupRepository: class AccountGroupRepository {},
  AccountRepository: class AccountRepository {},
  OAuth2CredentialRepository: class OAuth2CredentialRepository {},
}))

function invokeRegistrar(module: DynamicModule, registry: PlatformIntegrationRegistry) {
  const registrar = module.providers?.find(provider =>
    typeof provider === 'object' && 'provide' in provider && provider.provide === 'REDNOTE_INTEGRATION',
  )

  if (!registrar || !('useFactory' in registrar)) {
    return
  }

  registrar.useFactory(registry)
}

describe('rednote platform module', () => {
  it('does not register metadata when config is hidden or missing', () => {
    const registry = new PlatformIntegrationRegistry()

    invokeRegistrar(RedNoteModule.forRoot(undefined), registry)
    invokeRegistrar(RedNoteModule.forRoot({ status: PlatformStatus.Hidden }), registry)

    expect(registry.listMetadata()).toEqual([])
  })

  it('registers placeholder metadata without capabilities for coming soon config', () => {
    const registry = new PlatformIntegrationRegistry()

    invokeRegistrar(RedNoteModule.forRoot({
      status: PlatformStatus.ComingSoon,
      logoUrl: 'https://assets.aitoearn.ai/platforms/rednote.svg',
    }), registry)

    const [metadata] = registry.listMetadata()
    expect(metadata).toMatchObject({
      platform: AccountType.RedNote,
      status: PlatformStatus.ComingSoon,
      capabilities: {
        auth: { supported: false },
        publish: { supported: false },
      },
    })
  })

  it('registers publish capability for available config', () => {
    const registry = new PlatformIntegrationRegistry()
    const module = RedNoteModule.forRoot({
      status: PlatformStatus.Available,
      appKey: 'app-key',
      appSecret: 'app-secret',
      accessTokenUrl: 'https://edith.xiaohongshu.com/api/sns/v1/ext/access/token',
      redirectUri: 'https://api.example.test/callback',
      logoUrl: 'https://assets.aitoearn.ai/platforms/rednote.svg',
      scopes: [],
    })
    const publish = {
      platform: AccountType.RedNote,
      validate: vi.fn(),
      normalize: vi.fn(),
      publish: vi.fn(),
    }
    const registrar = module.providers?.find(provider =>
      typeof provider === 'object' && 'provide' in provider && provider.provide === 'REDNOTE_INTEGRATION',
    )

    expect(registrar && 'useFactory' in registrar).toBe(true)
    if (registrar && 'useFactory' in registrar) {
      registrar.useFactory(registry, publish)
    }

    const [metadata] = registry.listMetadata()
    expect(metadata).toMatchObject({
      platform: AccountType.RedNote,
      status: PlatformStatus.Available,
      capabilities: {
        publish: { supported: true },
      },
    })
  })
})
