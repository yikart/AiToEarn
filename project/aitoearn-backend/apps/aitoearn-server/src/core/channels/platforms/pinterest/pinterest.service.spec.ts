import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { PinterestBoardPrivacy } from './pinterest.schema'
import { PinterestService } from './pinterest.service'

function createService(baseUrl = 'https://api.pinterest.com/v5'): PinterestService {
  return new PinterestService({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/callback',
    logoUrl: 'https://assets.example.test/pinterest.svg',
    baseUrl,
    scopes: ['user_accounts:read'],
  } as never)
}

function createResponse<T>(
  data: T,
  config: InternalAxiosRequestConfig,
): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }
}

function setAdapter(
  service: PinterestService,
  adapter: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse<unknown>>,
) {
  const serviceWithHttp = service as unknown as {
    http: {
      defaults: {
        adapter: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse<unknown>>
      }
    }
  }
  serviceWithHttp.http.defaults.adapter = adapter
}

describe('pinterest service user account', () => {
  it('normalizes the configured API origin before requesting the profile', async () => {
    const service = createService('https://api.pinterest.com')

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://api.pinterest.com/v5/user_account')
      expect(config.method).toBe('get')
      expect(config.headers.Authorization).toBe('Bearer access-token')
      expect(config.params).toBeUndefined()

      return createResponse({
        id: 'pinterest-user-id',
        username: 'pinterest_user',
        business_name: 'Pinterest Business',
        profile_image: 'https://assets.example.test/pinterest.jpg',
        follower_count: 120,
        following_count: 7,
        monthly_views: 3000,
        pin_count: 18,
      }, config)
    })

    await expect(service.getUser('access-token')).resolves.toEqual({
      platformUid: 'pinterest-user-id',
      displayName: 'Pinterest Business',
      avatarUrl: 'https://assets.example.test/pinterest.jpg',
      username: 'pinterest_user',
      followerCount: 120,
      followingCount: 7,
      monthlyViews: 3000,
      pinCount: 18,
    })
  })

  it('does not duplicate the v5 prefix when the configured base URL already includes it', async () => {
    const service = createService('https://api.pinterest.com/v5')

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://api.pinterest.com/v5/user_account')

      return createResponse({
        id: 'pinterest-user-id',
        username: 'pinterest_user',
      }, config)
    })

    await expect(service.getUser('access-token')).resolves.toMatchObject({
      platformUid: 'pinterest-user-id',
      displayName: 'pinterest_user',
      followerCount: 0,
      followingCount: 0,
      monthlyViews: 0,
      pinCount: 0,
    })
  })

  it('normalizes nullable counters to zero', async () => {
    const service = createService('https://api.pinterest.com/v5')

    setAdapter(service, async (config) => {
      return createResponse({
        id: 'pinterest-user-id',
        username: 'pinterest_user',
        follower_count: null,
        following_count: null,
        monthly_views: null,
        pin_count: null,
      }, config)
    })

    await expect(service.getUser('access-token')).resolves.toMatchObject({
      followerCount: 0,
      followingCount: 0,
      monthlyViews: 0,
      pinCount: 0,
    })
  })
})

describe('pinterest service pins', () => {
  it('gets pins without overriding default API fields', async () => {
    const service = createService('https://api.pinterest.com')

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://api.pinterest.com/v5/pins/pin-id')
      expect(config.method).toBe('get')
      expect(config.headers.Authorization).toBe('Bearer access-token')
      expect(config.params).toBeUndefined()

      return createResponse({
        id: 'pin-id',
        title: 'Pin title',
      }, config)
    })

    await expect(service.getPin('access-token', 'pin-id')).resolves.toMatchObject({
      id: 'pin-id',
      title: 'Pin title',
    })
  })
})

describe('pinterest service oauth token', () => {
  it('exchanges authorization codes against the official v5 token endpoint', async () => {
    const service = createService('https://api.pinterest.com')

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://api.pinterest.com/v5/oauth/token')
      expect(config.method).toBe('post')
      expect(config.headers.Authorization).toBe(`Basic ${Buffer.from('client-id:client-secret').toString('base64')}`)
      expect(config.headers['Content-Type']).toBe('application/x-www-form-urlencoded')

      const body = new URLSearchParams(String(config.data))
      expect(body.get('grant_type')).toBe('authorization_code')
      expect(body.get('code')).toBe('auth-code')
      expect(body.get('redirect_uri')).toBe('https://api.example.test/callback')
      expect(body.get('continuous_refresh')).toBe('true')

      return createResponse({
        access_token: 'access-token',
        token_type: 'bearer',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        scope: 'user_accounts:read',
      }, config)
    })

    await expect(service.exchangeCode('auth-code')).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      scope: 'user_accounts:read',
    })
  })

  it('refreshes tokens against the same official v5 token endpoint', async () => {
    const service = createService('https://api.pinterest.com')

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://api.pinterest.com/v5/oauth/token')

      const body = new URLSearchParams(String(config.data))
      expect(body.get('grant_type')).toBe('refresh_token')
      expect(body.get('refresh_token')).toBe('refresh-token')

      return createResponse({
        access_token: 'new-access-token',
        token_type: 'bearer',
        refresh_token: 'new-refresh-token',
      }, config)
    })

    await expect(service.refreshAccessToken('refresh-token')).resolves.toMatchObject({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    })
  })
})

describe('pinterest service boards', () => {
  it('creates boards against the official v5 boards endpoint', async () => {
    const service = createService('https://api.pinterest.com')

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://api.pinterest.com/v5/boards')
      expect(config.method).toBe('post')
      expect(config.headers.Authorization).toBe('Bearer access-token')
      expect(config.headers['Content-Type']).toBe('application/json')
      expect(JSON.parse(String(config.data))).toEqual({
        name: 'Launch Board',
        description: 'Campaign board',
        privacy: PinterestBoardPrivacy.Secret,
      })

      return createResponse({
        id: 'board-id',
        name: 'Launch Board',
        description: 'Campaign board',
        privacy: PinterestBoardPrivacy.Secret,
      }, config)
    })

    await expect(service.createBoard('access-token', {
      name: 'Launch Board',
      description: 'Campaign board',
      privacy: PinterestBoardPrivacy.Secret,
    })).resolves.toEqual({
      id: 'board-id',
      name: 'Launch Board',
      description: 'Campaign board',
      privacy: PinterestBoardPrivacy.Secret,
    })
  })
})
