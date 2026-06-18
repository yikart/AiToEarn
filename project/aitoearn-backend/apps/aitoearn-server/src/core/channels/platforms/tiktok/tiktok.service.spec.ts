import type { MediaService } from '../../media/media.service'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory } from '../platforms.exception'
import { TikTokService } from './tiktok.service'

vi.mock('@yikart/assets', () => ({
  AssetsService: class AssetsService {},
  VideoMetadataService: class VideoMetadataService {},
}))

vi.mock('@yikart/mongodb', () => ({
  AssetType: {
    PublishMedia: 'publishMedia',
  },
}))

function createService(): TikTokService {
  return new TikTokService({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/api/v2/channels/accounts/auth/TIKTOK/callback',
    logoUrl: 'https://assets.aitoearn.ai/platforms/tiktok.svg',
    scopes: ['user.info.basic'],
  } as never, {} as MediaService)
}

describe('tiktok service axios interceptors', () => {
  it('converts successful HTTP platform body errors in the response interceptor', async () => {
    const service = createService()
    const serviceWithHttp = service as unknown as { http: { defaults: { adapter: unknown } } }
    serviceWithHttp.http.defaults.adapter = async (config: unknown) => ({
      data: {
        error: {
          code: 'access_token_invalid',
          message: 'access token expired',
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })

    await expect(service.getCreatorInfo('access-token')).rejects.toMatchObject({
      category: PlatformErrorCategory.MediaProcessingFailed,
      platformCause: {
        platformCode: 'access_token_invalid',
        platformMessage: 'access token expired',
      },
    })
  })
})

describe('tiktok service media upload', () => {
  it('sends content length for single chunk file uploads', async () => {
    const service = createService()
    const requests: Array<{ headers?: { get?: (name: string) => unknown } & Record<string, unknown> }> = []
    const serviceWithHttp = service as unknown as { http: { defaults: { adapter: unknown } } }
    serviceWithHttp.http.defaults.adapter = async (config: { headers?: { get?: (name: string) => unknown } & Record<string, unknown> }) => {
      requests.push(config)
      return {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }

    await service.uploadVideoFile('https://upload.example.test/video', Buffer.from('video-data'))

    const headers = requests[0].headers
    const contentLength = headers?.['Content-Length'] ?? headers?.get?.('Content-Length')
    expect(String(contentLength)).toBe(String(Buffer.from('video-data').length))
  })
})
