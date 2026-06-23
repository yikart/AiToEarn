import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ServerRedisService } from '../../../../common/redis'
import { describe, expect, it, vi } from 'vitest'
import { DouyinService } from './douyin.service'

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

function createRedis(): ServerRedisService {
  return {
    getDouyinClientToken: vi.fn(async () => null),
    saveDouyinClientToken: vi.fn(async () => true),
    deleteDouyinClientToken: vi.fn(async () => true),
    deleteDouyinOpenTicket: vi.fn(async () => true),
    getDouyinOpenTicket: vi.fn(async () => null),
    saveDouyinOpenTicket: vi.fn(async () => true),
  } as unknown as ServerRedisService
}

function createService(redis: ServerRedisService = createRedis()): DouyinService {
  return new DouyinService({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/callback',
  } as never, redis)
}

function setAdapter(
  service: DouyinService,
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

describe('douyin service direct create video', () => {
  it('puts open_id in query params and uses official cover field in body', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.method).toBe('post')
      expect(config.url).toBe('/api/douyin/v1/video/create_video/')
      expect(config.params).toEqual({ open_id: 'open-id' })
      expect(config.headers['access-token']).toBe('access-token')
      expect(JSON.parse(String(config.data))).toEqual({
        video_id: 'video-id',
        text: 'Title\nBody\n#topic',
        custom_cover_image_url: 'image-id',
        cover_tsp: 3,
        download_type: 1,
        private_status: 0,
      })

      return createResponse({
        data: {
          item_id: 'item-id',
        },
      }, config)
    })

    await expect(service.createVideo('access-token', 'open-id', {
      videoId: 'video-id',
      title: 'Title',
      description: 'Body',
      customCoverImageId: 'image-id',
      coverTsp: 3,
      downloadType: 1,
      privateStatus: 0,
      topics: ['topic'],
    })).resolves.toEqual({
      item_id: 'item-id',
    })
  })
})

describe('douyin service share id', () => {
  it('uses cached app client token and posts share_id creation request', async () => {
    const redis = createRedis()
    vi.mocked(redis.getDouyinClientToken).mockResolvedValueOnce({
      access_token: 'cached-client-token',
      expires_in: 7200,
    })
    const service = createService(redis)

    setAdapter(service, async (config) => {
      expect(config.method).toBe('post')
      expect(config.url).toBe('/share-id/')
      expect(config.params).toEqual({
        need_callback: true,
        default_hashtag: 'hashtag',
      })
      expect(config.headers['access-token']).toBe('cached-client-token')

      return createResponse({
        data: {
          share_id: 'share-id-1',
        },
      }, config)
    })

    await expect(service.getShareid()).resolves.toBe('share-id-1')
  })

  it('stores a fetched app client token and uses it for share_id creation', async () => {
    const redis = createRedis()
    const service = createService(redis)
    const calls: Array<{ method?: string, url?: string, data?: unknown, headers?: Record<string, unknown> }> = []

    setAdapter(service, async (config) => {
      calls.push({
        method: config.method,
        url: config.url,
        data: config.data,
        headers: config.headers as Record<string, unknown>,
      })

      if (config.url === '/oauth/client_token/') {
        return createResponse({
          data: {
            access_token: 'fresh-client-token',
            expires_in: 7200,
          },
        }, config)
      }

      expect(config.url).toBe('/share-id/')
      expect(config.headers['access-token']).toBe('fresh-client-token')
      return createResponse({
        data: {
          share_id: 'share-id-1',
        },
      }, config)
    })

    await expect(service.getShareid()).resolves.toBe('share-id-1')
    expect(calls.map(call => `${call.method} ${call.url}`)).toEqual([
      'post /oauth/client_token/',
      'post /share-id/',
    ])
    expect(redis.saveDouyinClientToken).toHaveBeenCalledWith({
      access_token: 'fresh-client-token',
      expires_in: 7200,
      expiresAt: expect.any(Number),
    })
  })

  it('refreshes stale app client token once when share_id creation reports token expiry', async () => {
    const redis = createRedis()
    vi.mocked(redis.getDouyinClientToken).mockResolvedValueOnce({
      access_token: 'stale-client-token',
      expires_in: 7200,
    })
    const service = createService(redis)
    const tokenRequests: string[] = []

    setAdapter(service, async (config) => {
      if (config.url === '/share-id/' && config.headers['access-token'] === 'stale-client-token') {
        return createResponse({
          data: {},
          extra: {
            error_code: 28001008,
            description: 'access_token过期,请刷新或重新授权',
          },
        }, config)
      }

      if (config.url === '/oauth/client_token/') {
        tokenRequests.push(String(config.url))
        return createResponse({
          data: {
            access_token: 'fresh-client-token',
            expires_in: 7200,
          },
        }, config)
      }

      expect(config.url).toBe('/share-id/')
      expect(config.headers['access-token']).toBe('fresh-client-token')
      return createResponse({
        data: {
          share_id: 'share-id-2',
        },
      }, config)
    })

    await expect(service.getShareid()).resolves.toBe('share-id-2')
    expect(tokenRequests).toHaveLength(1)
    expect(redis.deleteDouyinClientToken).toHaveBeenCalled()
    expect(redis.deleteDouyinOpenTicket).toHaveBeenCalled()
  })

  it('posts share publish result request with app client token', async () => {
    const redis = createRedis()
    vi.mocked(redis.getDouyinClientToken).mockResolvedValueOnce({
      access_token: 'cached-client-token',
      expires_in: 7200,
    })
    const service = createService(redis)

    setAdapter(service, async (config) => {
      expect(config.method).toBe('post')
      expect(config.url).toBe('/share-id/')
      expect(config.params).toEqual({ share_id: 'share-id-1' })
      expect(config.headers['access-token']).toBe('cached-client-token')

      return createResponse({
        data: {
          share_id: 'share-id-1',
          item_id: 'item-id-1',
          video_id: 'video-id-1',
          share_url: 'https://www.douyin.com/video/video-id-1',
        },
      }, config)
    })

    await expect(service.getSharePublishResult('share-id-1')).resolves.toEqual({
      shareId: 'share-id-1',
      itemId: 'item-id-1',
      videoId: 'video-id-1',
      shareUrl: 'https://www.douyin.com/video/video-id-1',
      raw: {
        share_id: 'share-id-1',
        item_id: 'item-id-1',
        video_id: 'video-id-1',
        share_url: 'https://www.douyin.com/video/video-id-1',
      },
    })
  })
})
