import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TwitterService } from './twitter.service'

vi.mock('@yikart/mongodb', () => ({
  AccountRepository: class AccountRepository {},
  Transactional: () => () => undefined,
}))

afterEach(() => {
  vi.restoreAllMocks()
})

function createService() {
  return new TwitterService({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    redirectUri: 'https://api.example.test/api/v2/channels/accounts/auth/twitter/callback',
    logoUrl: 'https://assets.aitoearn.ai/platforms/twitter.svg',
    scopes: ['tweet.write', 'media.write'],
  } as never)
}

describe('twitter service media upload', () => {
  it('uploads append chunks to media append endpoint without legacy command fields', async () => {
    const service = createService()
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} })
    const media = Buffer.from('chunk-data')

    await expect(service.appendMediaUpload('access-token', {
      mediaId: 'media-1',
      media: new Blob([new Uint8Array(media)]),
      segmentIndex: 0,
    })).resolves.toBeUndefined()

    expect(post).toHaveBeenCalledWith(
      'https://api.x.com/2/media/upload/media-1/append',
      expect.any(FormData),
      {
        headers: {
          Authorization: 'Bearer access-token',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    )
    const formData = post.mock.calls[0][1] as FormData
    expect(formData.has('command')).toBe(false)
    expect(formData.has('media_id')).toBe(false)
    expect(formData.get('segment_index')).toBe('0')
    const uploadedMedia = formData.get('media') as Blob
    expect(Buffer.from(await uploadedMedia.arrayBuffer())).toEqual(media)
  })

  it('reads camelCase processing info returned by XDK media finalize and status APIs', async () => {
    const service = createService()
    const mediaClient = {
      finalizeUpload: vi.fn(async () => ({
        data: {
          id: 'media-1',
          processingInfo: {
            state: 'pending',
            checkAfterSecs: 0,
          },
        },
      })),
      getUploadStatus: vi.fn(async () => ({
        data: {
          id: 'media-1',
          processingInfo: {
            state: 'succeeded',
            progressPercent: 100,
          },
        },
      })),
    }
    const serviceWithClient = service as unknown as { createApiClient: () => { media: typeof mediaClient } }
    serviceWithClient.createApiClient = () => ({
      media: mediaClient,
    })

    await expect(service.finalizeMediaUpload('access-token', 'media-1')).resolves.toEqual({
      mediaId: 'media-1',
      processingInfo: {
        state: 'pending',
        checkAfterSecs: 0,
      },
    })
    await expect(service.getMediaStatus('access-token', 'media-1')).resolves.toEqual({
      mediaId: 'media-1',
      processingInfo: {
        state: 'succeeded',
        progressPercent: 100,
      },
    })
  })

  it('keeps reading snake_case processing info for raw media responses', async () => {
    const service = createService()
    const mediaClient = {
      finalizeUpload: vi.fn(async () => ({
        data: {
          id: 'media-1',
          processing_info: {
            state: 'pending',
            check_after_secs: 0,
          },
        },
      })),
      getUploadStatus: vi.fn(async () => ({
        data: {
          id: 'media-1',
          processing_info: {
            state: 'succeeded',
            progress_percent: 100,
          },
        },
      })),
    }
    const serviceWithClient = service as unknown as { createApiClient: () => { media: typeof mediaClient } }
    serviceWithClient.createApiClient = () => ({
      media: mediaClient,
    })

    await expect(service.finalizeMediaUpload('access-token', 'media-1')).resolves.toEqual({
      mediaId: 'media-1',
      processingInfo: {
        state: 'pending',
        check_after_secs: 0,
      },
    })
    await expect(service.getMediaStatus('access-token', 'media-1')).resolves.toEqual({
      mediaId: 'media-1',
      processingInfo: {
        state: 'succeeded',
        progress_percent: 100,
      },
    })
  })
})
