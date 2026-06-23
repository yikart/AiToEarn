import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { MediaService } from '../../media/media.service'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory } from '../platforms.exception'
import { BilibiliService } from './bilibili.service'

vi.mock('@yikart/assets', () => ({
  AssetsService: class AssetsService {},
  VideoMetadataService: class VideoMetadataService {},
}))

vi.mock('@yikart/mongodb', () => ({
  AssetType: {
    PublishMedia: 'publishMedia',
  },
}))

function createService(): BilibiliService {
  return new BilibiliService({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/api/v2/channels/accounts/auth/BILIBILI/callback',
    logoUrl: 'https://assets.aitoearn.ai/platforms/bilibili.svg',
    scopes: [],
  } as never, {} as MediaService)
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
  service: BilibiliService,
  adapter: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse<unknown>>,
) {
  const serviceWithHttp = service as unknown as {
    platformHttp: {
      defaults: {
        adapter: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse<unknown>>
      }
    }
  }
  serviceWithHttp.platformHttp.defaults.adapter = adapter
}

describe('bilibili service axios interceptors', () => {
  it('converts successful HTTP platform body errors in the response interceptor', async () => {
    const service = createService()
    const serviceWithHttp = service as unknown as { platformHttp: { defaults: { adapter: unknown } } }
    serviceWithHttp.platformHttp.defaults.adapter = async (config: unknown) => ({
      data: {
        code: -400,
        message: 'invalid authorization code',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })

    await expect(service.exchangeCode('bad-code')).rejects.toMatchObject({
      category: PlatformErrorCategory.Auth,
      platformCause: {
        platformCode: -400,
        platformMessage: 'invalid authorization code',
      },
    })
  })
})

describe('bilibili service auth tokens', () => {
  it('calculates exchanged token expiry from the current time', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-02T00:00:00.000Z'))
    try {
      const service = createService()
      setAdapter(service, async config => createResponse({
        code: 0,
        message: '0',
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
        },
      }, config))

      await expect(service.exchangeCode('auth-code')).resolves.toMatchObject({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date('2026-06-02T01:00:00.000Z'),
      })
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('calculates refreshed token expiry from the current time', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-02T00:00:00.000Z'))
    try {
      const service = createService()
      setAdapter(service, async config => createResponse({
        code: 0,
        message: '0',
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 7200,
        },
      }, config))

      await expect(service.refreshAccessToken('refresh-token')).resolves.toMatchObject({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date('2026-06-02T02:00:00.000Z'),
      })
    }
    finally {
      vi.useRealTimers()
    }
  })
})

describe('bilibili service data APIs', () => {
  it('reads official user stat fields for account stats', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://member.bilibili.com/arcopen/fn/data/user/stat')
      expect(config.method).toBe('get')
      expect(config.headers['Access-Token']).toBe('access-token')

      return createResponse({
        code: 0,
        message: '0',
        data: {
          follower: '1200',
          following: 8,
          arc_passed_total: '33',
        },
      }, config)
    })

    await expect(service.getUserStat('access-token')).resolves.toEqual({
      fansCount: 1200,
      followingCount: 8,
      archiveCount: 33,
    })
  })

  it('requests official archive stat by resource id', async () => {
    const service = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://member.bilibili.com/arcopen/fn/data/arc/stat')
      expect(config.method).toBe('get')
      expect(config.params).toEqual({ resource_id: 'BV1xx411c7mD' })
      expect(config.headers['Access-Token']).toBe('access-token')

      return createResponse({
        code: 0,
        message: '0',
        data: {
          title: 'Video title',
          ptime: 1780050000,
          view: 100,
          like: '20',
          coin: '3',
          favorite: 4,
          share: 5,
          danmaku: 6,
          reply: 7,
        },
      }, config)
    })

    await expect(service.getArchiveStat('access-token', 'BV1xx411c7mD')).resolves.toEqual({
      title: 'Video title',
      ptime: 1780050000,
      view: 100,
      like: '20',
      coin: '3',
      favorite: 4,
      share: 5,
      danmaku: 6,
      reply: 7,
    })
  })
})
