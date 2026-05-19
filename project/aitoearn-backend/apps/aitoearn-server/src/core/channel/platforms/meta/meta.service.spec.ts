import { AccountType } from '@yikart/aitoearn-server-client'
import { describe, expect, it, vi } from 'vitest'
import { FacebookOAuth2Config } from '../../libs/facebook/constants'
import { FacebookService } from '../../libs/facebook/facebook.service'
import { InstagramOAuth2Config } from '../../libs/instagram/constants'
import { InstagramService } from '../../libs/instagram/instagram.service'
import {
  META_FACEBOOK_GRAPH_API_BASE_URL,
  META_GRAPH_API_VERSION,
  META_INSTAGRAM_GRAPH_API_BASE_URL,
} from '../../libs/meta/constants'
import { metaOAuth2ConfigMap } from './constants'
import { MetaService } from './meta.service'

vi.mock('@yikart/aitoearn-server-client', () => ({
  AccountStatus: {},
  AccountType: {
    FACEBOOK: 'facebook',
    INSTAGRAM: 'instagram',
  },
}))

vi.mock('@yikart/channel-db', () => ({
  OAuth2CredentialRepository: class {},
}))

vi.mock('@yikart/redis', () => ({
  RedisService: class {},
}))

vi.mock('@yikart/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@yikart/common')>()
  return {
    ...actual,
    getErrorMessage: (error: unknown) => error instanceof Error ? error.message : String(error),
    getErrorStack: (error: unknown) => error instanceof Error ? error.stack : undefined,
  }
})

vi.mock('../channel-account.service', () => ({
  ChannelAccountService: class {},
}))

vi.mock('../../../../config', () => ({
  config: {
    channel: {
      oauth: {
        facebook: {
          clientId: 'facebook_client',
          clientSecret: 'facebook_secret',
          redirectUri: 'https://example.com/facebook/callback',
        },
        instagram: {
          clientId: 'instagram_client',
          clientSecret: 'instagram_secret',
          redirectUri: 'https://example.com/instagram/callback',
        },
      },
    },
  },
}))

describe('metaService', () => {
  it('meta Graph API URL 使用统一版本', () => {
    expect(META_GRAPH_API_VERSION).toBe('v24.0')
    expect(FacebookOAuth2Config.apiBaseUrl).toBe(META_FACEBOOK_GRAPH_API_BASE_URL)
    expect(FacebookOAuth2Config.authURL).toBe(`https://www.facebook.com/${META_GRAPH_API_VERSION}/dialog/oauth`)
    expect(FacebookOAuth2Config.userProfileURL).toContain(`${META_FACEBOOK_GRAPH_API_BASE_URL}/me`)
    expect(FacebookOAuth2Config.pageAccountURL).toBe(`${META_FACEBOOK_GRAPH_API_BASE_URL}/me/accounts`)
    expect(InstagramOAuth2Config.apiBaseUrl).toBe(META_INSTAGRAM_GRAPH_API_BASE_URL)
    expect(InstagramOAuth2Config.userProfileURL).toContain(`${META_INSTAGRAM_GRAPH_API_BASE_URL}/me`)
    expect((new FacebookService() as any).apiBaseUrl).toBe(META_FACEBOOK_GRAPH_API_BASE_URL)
    expect((new InstagramService() as any).apiBaseUrl).toBe(META_INSTAGRAM_GRAPH_API_BASE_URL)
  })

  it('meta OAuth 关闭 PKCE 时不写入 codeVerifier', async () => {
    const originalPkce = metaOAuth2ConfigMap[AccountType.FACEBOOK].pkce
    metaOAuth2ConfigMap[AccountType.FACEBOOK].pkce = false
    const redisService = {
      setJson: vi.fn().mockResolvedValue(true),
    }
    const service = new MetaService(redisService as any, {} as any)

    try {
      const result = await service.generateAuthorizeURL('user_1', AccountType.FACEBOOK)

      expect(result?.url).not.toContain('code_challenge')
      const authTask = redisService.setJson.mock.calls[0][1]
      expect(authTask).toMatchObject({
        userId: 'user_1',
        pkce: false,
        platform: AccountType.FACEBOOK,
        status: 0,
      })
      expect(authTask).not.toHaveProperty('codeVerifier')
    }
    finally {
      metaOAuth2ConfigMap[AccountType.FACEBOOK].pkce = originalPkce
    }
  })

  it('meta OAuth 开启 PKCE 时持久化 codeVerifier', async () => {
    const originalPkce = metaOAuth2ConfigMap[AccountType.FACEBOOK].pkce
    metaOAuth2ConfigMap[AccountType.FACEBOOK].pkce = true
    const redisService = {
      setJson: vi.fn().mockResolvedValue(true),
    }
    const service = new MetaService(redisService as any, {} as any)

    try {
      const result = await service.generateAuthorizeURL('user_1', AccountType.FACEBOOK)

      expect(result?.url).toContain('code_challenge_method=S256')
      const authTask = redisService.setJson.mock.calls[0][1]
      expect(authTask).toMatchObject({
        userId: 'user_1',
        pkce: true,
        platform: AccountType.FACEBOOK,
        status: 0,
      })
      expect(authTask.codeVerifier).toMatch(/^[\da-f]{128}$/)
    }
    finally {
      metaOAuth2ConfigMap[AccountType.FACEBOOK].pkce = originalPkce
    }
  })

  it('保留 Meta OAuth scope 扩展', () => {
    expect(FacebookOAuth2Config.defaultScopes).toEqual(expect.arrayContaining([
      'pages_read_user_content',
      'pages_manage_engagement',
      'pages_manage_metadata',
      'read_insights',
    ]))
    expect(InstagramOAuth2Config.defaultScopes).toEqual(expect.arrayContaining([
      'instagram_business_manage_comments',
      'instagram_business_manage_insights',
    ]))
  })
})
