import { ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { KwaiAuthProvider } from './kwai-auth.provider'

function createProvider() {
  const kwaiService = {
    exchangeCode: vi.fn(async () => ({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date('2026-05-29T00:00:00.000Z'),
      scope: 'user_info',
      openId: 'open-id-1',
    })),
    getUserInfo: vi.fn(async () => ({
      displayName: 'Kwai Nickname',
      avatarUrl: 'https://assets.example.test/avatar.jpg',
      fanCount: 12,
      followCount: 3,
    })),
    generateAuthUrl: vi.fn(() => 'https://open.kuaishou.com/oauth2/authorize'),
    refreshToken: vi.fn(),
  }
  const provider = new KwaiAuthProvider(kwaiService as never, {
    scopes: ['user_info'],
    redirectUri: 'https://api.example.test/callback',
  } as never)

  return { provider, kwaiService }
}

describe('kwai auth provider', () => {
  it('uses open_id as platformUid after exchanging code', async () => {
    const { provider } = createProvider()

    await expect(provider.exchangeCode({
      query: { code: 'code-1', state: 'session-1' },
      session: { id: 'session-1' },
    } as never)).resolves.toMatchObject({
      accessToken: 'access-token',
      platformUid: 'open-id-1',
    })
  })

  it('uses the authorized Kwai user as a single account profile', async () => {
    const { provider } = createProvider()

    await expect(provider.getProfile({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      platformUid: 'open-id-1',
    })).resolves.toMatchObject({
      platformUid: 'open-id-1',
      displayName: 'Kwai Nickname',
      avatarUrl: 'https://assets.example.test/avatar.jpg',
      raw: {
        fanCount: 12,
        followCount: 3,
      },
    })
    expect('listSelectableAccounts' in provider).toBe(false)
  })

  it('rejects profile lookup when platformUid is missing', async () => {
    const { provider, kwaiService } = createProvider()

    await expect(provider.getProfile({ accessToken: 'access-token' })).rejects.toMatchObject({
      code: ResponseCode.ChannelAuthPlatformUidMissing,
    })
    expect(kwaiService.getUserInfo).not.toHaveBeenCalled()
  })
})
