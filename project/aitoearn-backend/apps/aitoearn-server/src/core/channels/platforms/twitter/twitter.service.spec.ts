import { describe, expect, it, vi } from 'vitest'
import { TwitterService } from './twitter.service'

vi.mock('@yikart/mongodb', () => ({
  AccountRepository: class AccountRepository {},
  Transactional: () => () => undefined,
}))

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
