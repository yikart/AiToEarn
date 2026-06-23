import type { MediaService } from '../../media/media.service'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCategory } from '../platforms.exception'
import { TikTokPublishStatus } from './tiktok.interface'
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

  it('keeps unsafe publish status post ids as strings while preserving safe numbers', async () => {
    const service = createService()
    const requests: Array<{ responseType?: unknown, transformResponse?: unknown }> = []
    const serviceWithHttp = service as unknown as { http: { defaults: { adapter: unknown } } }
    serviceWithHttp.http.defaults.adapter = async (config: { responseType?: unknown, transformResponse?: unknown }) => {
      requests.push(config)
      return {
        data: '{"data":{"publicaly_available_post_id":[7654132326040947989],"uploaded_bytes":123,"status":"PUBLISH_COMPLETE"}}',
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }

    const status = await service.getPublishStatus('access-token', 'publish-1')

    expect(requests[0].responseType).toBe('text')
    expect(status).toEqual({
      publicaly_available_post_id: ['7654132326040947989'],
      uploaded_bytes: 123,
      status: TikTokPublishStatus.PublishComplete,
    })
    expect(typeof status.publicaly_available_post_id?.[0]).toBe('string')
    expect(typeof status.uploaded_bytes).toBe('number')
  })

  it('still converts platform errors from text publish status responses', async () => {
    const service = createService()
    const serviceWithHttp = service as unknown as { http: { defaults: { adapter: unknown } } }
    serviceWithHttp.http.defaults.adapter = async (config: unknown) => ({
      data: '{"error":{"code":"invalid_params","message":"publish_id is invalid"}}',
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })

    await expect(service.getPublishStatus('access-token', 'publish-1')).rejects.toMatchObject({
      category: PlatformErrorCategory.MediaProcessingFailed,
      platformCause: {
        platformCode: 'invalid_params',
        platformMessage: 'publish_id is invalid',
      },
    })
  })
})

describe('tiktok service media upload', () => {
  it('uses TikTok floor chunk count and puts the remainder in the last chunk', () => {
    const service = createService()
    const chunkSize = 10 * 1024 * 1024
    const fileSize = 70 * 1024 * 1024 + 123

    const plan = service.getUploadPlan(fileSize)

    expect(plan.chunkSize).toBe(chunkSize)
    expect(plan.totalChunkCount).toBe(7)
    expect(plan.ranges).toHaveLength(7)
    expect(plan.ranges[0]).toEqual([0, chunkSize - 1])
    expect(plan.ranges[6]).toEqual([6 * chunkSize, fileSize - 1])
  })

  it('keeps videos up to 64 MiB as a single upload chunk', () => {
    const service = createService()
    const fileSize = 64 * 1024 * 1024

    expect(service.getUploadPlan(fileSize)).toEqual({
      chunkSize: fileSize,
      totalChunkCount: 1,
      ranges: [[0, fileSize - 1]],
    })
  })

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

    const video = new Blob([new Uint8Array(Buffer.from('video-data'))])
    await service.uploadVideoFile('https://upload.example.test/video', video, video.size)

    const headers = requests[0].headers
    const contentLength = headers?.['Content-Length'] ?? headers?.get?.('Content-Length')
    expect(String(contentLength)).toBe(String(video.size))
  })
})
