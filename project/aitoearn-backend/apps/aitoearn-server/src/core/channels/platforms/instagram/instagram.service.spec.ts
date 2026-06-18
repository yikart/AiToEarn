import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ResponseCode } from '@yikart/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InstagramMediaType } from './instagram.schema'
import { InstagramService } from './instagram.service'

function createService(): InstagramService {
  return new InstagramService({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/api/v2/channels/accounts/auth/instagram/callback',
    logoUrl: 'https://assets.aitoearn.ai/platforms/instagram.svg',
    graphApiVersion: 'v25.0',
    webhookVerifyToken: '',
    scopes: ['instagram_business_basic'],
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
  service: InstagramService,
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

describe('instagram service auth token exchange', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('exchanges authorization code through Instagram token endpoint and stores the long-lived token', async () => {
    const service = createService()
    const requests: InternalAxiosRequestConfig[] = []

    setAdapter(service, async (config) => {
      requests.push(config)

      if (config.url === 'https://api.instagram.com/oauth/access_token') {
        const body = new URLSearchParams(String(config.data))
        expect(config.method).toBe('post')
        expect(JSON.parse(JSON.stringify(config.headers))).toMatchObject({
          'Content-Type': 'application/x-www-form-urlencoded',
        })
        expect(body.get('client_id')).toBe('client-id')
        expect(body.get('client_secret')).toBe('client-secret')
        expect(body.get('grant_type')).toBe('authorization_code')
        expect(body.get('redirect_uri')).toBe('https://api.example.test/api/v2/channels/accounts/auth/instagram/callback')
        expect(body.get('code')).toBe('oauth-code')

        return createResponse({
          access_token: 'short-lived-token',
          token_type: 'bearer',
          expires_in: 3600,
          permissions: [
            'instagram_business_basic',
            'instagram_business_manage_insights',
          ],
        }, config)
      }

      if (config.url === 'https://graph.instagram.com/access_token') {
        const params = config.params as URLSearchParams
        expect(config.method).toBe('get')
        expect(params.get('grant_type')).toBe('ig_exchange_token')
        expect(params.get('client_secret')).toBe('client-secret')
        expect(params.get('access_token')).toBe('short-lived-token')

        return createResponse({
          access_token: 'long-lived-token',
          expires_in: 5184000,
        }, config)
      }

      throw new Error(`Unexpected request ${config.method} ${config.url}`)
    })

    const result = await service.exchangeCode('oauth-code')

    expect(requests.map(request => request.url)).toEqual([
      'https://api.instagram.com/oauth/access_token',
      'https://graph.instagram.com/access_token',
    ])
    expect(result.accessToken).toBe('long-lived-token')
    expect(result.expiresAt).toEqual(new Date('2026-03-02T00:00:00.000Z'))
    expect(result.scope).toBe('instagram_business_basic,instagram_business_manage_insights')
  })

  it('refreshes long-lived tokens through the Instagram refresh endpoint', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://graph.instagram.com/refresh_access_token')
      expect(config.method).toBe('get')

      const params = config.params as URLSearchParams
      expect(params.get('grant_type')).toBe('ig_refresh_token')
      expect(params.get('access_token')).toBe('long-lived-token')

      return createResponse({
        access_token: 'refreshed-long-lived-token',
        expires_in: 5184000,
      }, config)
    })

    const result = await service.refreshAccessToken('long-lived-token')

    expect(result.accessToken).toBe('refreshed-long-lived-token')
    expect(result.expiresAt).toEqual(new Date('2026-03-02T00:00:00.000Z'))
  })

  it('loads the Instagram Login profile without Facebook accounts fields', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://graph.instagram.com/v25.0/me')
      expect(config.method).toBe('get')
      expect(config.params).toMatchObject({
        fields: 'id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count',
        access_token: 'long-lived-token',
      })
      expect(String(config.params.fields)).not.toContain('accounts')

      return createResponse({
        id: 'business-scoped-id',
        user_id: 'ig-user-id',
        username: 'creator',
        name: 'Creator Name',
        account_type: 'Business',
        profile_picture_url: 'https://assets.example.test/creator.jpg',
        followers_count: 120,
        follows_count: 15,
        media_count: 8,
      }, config)
    })

    await expect(service.getInstagramUser('long-lived-token')).resolves.toEqual({
      platformUid: 'ig-user-id',
      displayName: 'Creator Name',
      avatarUrl: 'https://assets.example.test/creator.jpg',
      username: 'creator',
      accountType: 'Business',
      followersCount: 120,
      followsCount: 15,
      mediaCount: 8,
    })
  })

  it('falls back to the Graph id when Instagram user_id is absent', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://graph.instagram.com/v25.0/me')

      return createResponse({
        id: 'graph-id',
      }, config)
    })

    await expect(service.getInstagramUser('long-lived-token')).resolves.toEqual({
      platformUid: 'graph-id',
      displayName: 'graph-id',
      username: undefined,
    })
  })
})

describe('instagram media containers', () => {
  it('rejects imageUrl and videoUrl together', async () => {
    const service = createService()
    const adapter = vi.fn()
    setAdapter(service, adapter)

    await expect(service.createMediaContainer('access-token', 'ig-user-id', {
      imageUrl: 'https://assets.example.test/image.jpg',
      videoUrl: 'https://assets.example.test/video.mp4',
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformMediaUnsupported,
    })

    expect(adapter).not.toHaveBeenCalled()
  })

  it('passes stories media_type for image and video story containers', async () => {
    const service = createService()
    const requests: InternalAxiosRequestConfig[] = []

    setAdapter(service, async (config) => {
      requests.push(config)
      return createResponse({ id: `container-${requests.length}` }, config)
    })

    await expect(service.createMediaContainer('access-token', 'ig-user-id', {
      imageUrl: 'https://assets.example.test/story.jpg',
      mediaType: InstagramMediaType.Stories,
    })).resolves.toBe('container-1')
    await expect(service.createMediaContainer('access-token', 'ig-user-id', {
      videoUrl: 'https://assets.example.test/story.mp4',
      mediaType: InstagramMediaType.Stories,
    })).resolves.toBe('container-2')

    expect(requests[0]?.params).toMatchObject({
      image_url: 'https://assets.example.test/story.jpg',
      media_type: InstagramMediaType.Stories,
      access_token: 'access-token',
    })
    expect(requests[1]?.params).toMatchObject({
      video_url: 'https://assets.example.test/story.mp4',
      media_type: InstagramMediaType.Stories,
      access_token: 'access-token',
    })
  })

  it('passes cover_url for video media containers', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.params).toMatchObject({
        video_url: 'https://assets.example.test/reel.mp4',
        media_type: InstagramMediaType.Reels,
        cover_url: 'https://assets.example.test/reel-cover.jpg',
        access_token: 'access-token',
      })
      return createResponse({ id: 'reel-container' }, config)
    })

    await expect(service.createMediaContainer('access-token', 'ig-user-id', {
      videoUrl: 'https://assets.example.test/reel.mp4',
      coverUrl: 'https://assets.example.test/reel-cover.jpg',
      mediaType: InstagramMediaType.Reels,
    })).resolves.toBe('reel-container')
  })

  it('defaults video media containers to reels', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.params).toMatchObject({
        video_url: 'https://assets.example.test/reel.mp4',
        media_type: InstagramMediaType.Reels,
        access_token: 'access-token',
      })
      return createResponse({ id: 'reel-container' }, config)
    })

    await expect(service.createMediaContainer('access-token', 'ig-user-id', {
      videoUrl: 'https://assets.example.test/reel.mp4',
    })).resolves.toBe('reel-container')
  })

  it('ignores Graph id on media container status responses', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://graph.instagram.com/v25.0/container-1')
      expect(config.method).toBe('get')
      expect(config.params).toMatchObject({
        fields: 'status_code,status',
        access_token: 'access-token',
      })

      return createResponse({
        id: 'container-1',
        status_code: 'FINISHED',
        status: 'Finished',
      }, config)
    })

    await expect(service.getMediaContainerStatus('access-token', 'container-1')).resolves.toEqual({
      statusCode: 'FINISHED',
      status: 'Finished',
    })
  })

  it('loads content publishing limit usage for an Instagram account', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://graph.instagram.com/v25.0/ig-user-id/content_publishing_limit')
      expect(config.method).toBe('get')
      expect(config.params).toMatchObject({
        fields: 'config,quota_usage',
        access_token: 'access-token',
      })

      return createResponse({
        data: [{
          quota_usage: 50,
          config: {
            quota_total: 50,
            quota_duration: 86400,
          },
        }],
      }, config)
    })

    await expect(service.getContentPublishingLimit('access-token', 'ig-user-id')).resolves.toEqual({
      quotaUsage: 50,
      quotaTotal: 50,
      quotaDuration: 86400,
    })
  })
})
