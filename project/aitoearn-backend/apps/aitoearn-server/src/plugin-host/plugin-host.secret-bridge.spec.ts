import type { PluginHostService } from './plugin-host.service'
import { PluginErrorCode } from '@airongrong/plugin-api'
import { describe, expect, it, vi } from 'vitest'
import { PLUGIN_SECRET_KEYS, PluginSecretBridge } from './plugin-host.secret-bridge'

function createBridge(credential: { accessToken: string, refreshToken?: string } | null) {
  let resolver: ((pluginId: string, key: string, accountId?: string) => Promise<string>) | undefined
  const pluginHost = {
    registerSecretResolver: (fn: typeof resolver) => {
      resolver = fn
    },
  } as unknown as PluginHostService
  const credentials = {
    getCredential: vi.fn(async () => credential),
  }
  const bridge = new PluginSecretBridge(pluginHost, credentials as never)
  if (!resolver) {
    throw new Error('resolver not registered')
  }
  return { bridge, resolver, credentials }
}

describe('plugin secret bridge', () => {
  it('resolves oauth access token from account credentials', async () => {
    const { resolver, credentials } = createBridge({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    await expect(resolver('hook.media-spec', PLUGIN_SECRET_KEYS.oauthAccessToken, 'account-1'))
      .resolves
      .toBe('access-token')
    expect(credentials.getCredential).toHaveBeenCalledWith('account-1')
  })

  it('resolves oauth refresh token when present', async () => {
    const { resolver } = createBridge({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    await expect(resolver('hook.media-spec', PLUGIN_SECRET_KEYS.oauthRefreshToken, 'account-1'))
      .resolves
      .toBe('refresh-token')
  })

  it('rejects when the account has no credential', async () => {
    const { resolver } = createBridge(null)

    await expect(resolver('hook.media-spec', PLUGIN_SECRET_KEYS.oauthAccessToken, 'account-1'))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
  })

  it('rejects when accountId is missing', async () => {
    const { resolver } = createBridge({ accessToken: 'access-token' })

    await expect(resolver('hook.media-spec', PLUGIN_SECRET_KEYS.oauthAccessToken))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
  })

  it('rejects keys outside the whitelist', async () => {
    const { resolver, credentials } = createBridge({ accessToken: 'access-token' })

    await expect(resolver('hook.media-spec', 'oauth.id_token', 'account-1'))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
    expect(credentials.getCredential).not.toHaveBeenCalled()
  })

  it('rejects refresh token when the credential has none', async () => {
    const { resolver } = createBridge({ accessToken: 'access-token' })

    await expect(resolver('hook.media-spec', PLUGIN_SECRET_KEYS.oauthRefreshToken, 'account-1'))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
  })
})
