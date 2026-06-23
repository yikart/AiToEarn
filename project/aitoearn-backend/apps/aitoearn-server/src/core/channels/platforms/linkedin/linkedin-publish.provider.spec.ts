import type { MediaService } from '../../media/media.service'
import type { LinkedInService } from './linkedin.service'
import { Readable } from 'node:stream'
import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PlatformErrorCauseType } from '../platforms.exception'
import { LinkedInPublishProvider } from './linkedin-publish.provider'
import { LinkedInAccountType } from './linkedin.schema'

vi.mock('../../media/media.service', () => ({
  MediaService: class {},
}))

async function readStream(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function createProvider() {
  const video = Buffer.from('video-data')
  const linkedinService = {
    registerVideoUpload: vi.fn(),
    uploadBinary: vi.fn(),
    finalizeVideoUpload: vi.fn(),
    createVideoPost: vi.fn(),
    createTextPost: vi.fn(),
  }
  const mediaService = {
    withUploadSource: vi.fn(async (_input, handler) => handler({
      sizeBytes: video.length,
      contentType: 'video/mp4',
      filename: 'video.mp4',
      stream: range => Readable.from(video.subarray(range?.start ?? 0, range ? range.end + 1 : video.length)),
      blob: async range => new Blob([new Uint8Array(video.subarray(range?.start ?? 0, range ? range.end + 1 : video.length))], { type: 'video/mp4' }),
    })),
  }

  return {
    provider: new LinkedInPublishProvider(
      linkedinService as unknown as LinkedInService,
      mediaService as unknown as MediaService,
    ),
    linkedinService,
    mediaService,
  }
}

function createVideoPublishInput() {
  return {
    taskId: 'task-1',
    platform: AccountType.LinkedIn,
    accountId: 'account-1',
    credential: {
      accessToken: 'access-token',
    },
    content: {
      body: 'caption',
      media: [{ url: 'https://cdn.example.test/video.mp4' }],
    },
    option: {
      authorUrn: 'urn:li:person:member-1',
    },
  }
}

describe('linkedin publish provider video upload', () => {
  it('rejects metadata video with a non-MP4 URL before falling back to text', async () => {
    const { provider, linkedinService, mediaService } = createProvider()

    await expect(provider.publish({
      ...createVideoPublishInput(),
      content: {
        body: 'caption',
        media: [{ url: 'https://cdn.example.test/video.mov', metadata: { type: 'video' } }],
      },
    })).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformMediaUnsupported,
    })

    expect(mediaService.withUploadSource).not.toHaveBeenCalled()
    expect(linkedinService.createTextPost).not.toHaveBeenCalled()
    expect(linkedinService.createVideoPost).not.toHaveBeenCalled()
  })

  it('accepts an empty LinkedIn upload token and finalizes the video upload', async () => {
    const { provider, linkedinService, mediaService } = createProvider()
    const videoBuffer = Buffer.from('video-data')
    linkedinService.registerVideoUpload.mockResolvedValueOnce({
      value: {
        video: 'urn:li:video:video-1',
        uploadToken: '',
        uploadInstructions: [
          {
            uploadUrl: 'https://upload.linkedin.example.test/part-1',
            firstByte: 0,
            lastByte: 4,
          },
          {
            uploadUrl: 'https://upload.linkedin.example.test/part-2',
            firstByte: 5,
            lastByte: 9,
          },
        ],
      },
    })
    linkedinService.uploadBinary
      .mockResolvedValueOnce('etag-part-1')
      .mockResolvedValueOnce('etag-part-2')
    linkedinService.createVideoPost.mockResolvedValueOnce({
      id: 'urn:li:activity:post-1',
    })

    await expect(provider.publish(createVideoPublishInput())).resolves.toEqual({
      status: 200,
      platformWorkId: 'urn:li:activity:post-1',
      permalink: 'https://www.linkedin.com/feed/update/urn:li:activity:post-1',
      dataOption: {
        authorUrn: 'urn:li:person:member-1',
        accountType: LinkedInAccountType.Person,
      },
    })

    expect(mediaService.withUploadSource).toHaveBeenCalledWith({
      platform: AccountType.LinkedIn,
      endpoint: 'uploadVideo.downloadMedia',
      url: 'https://cdn.example.test/video.mp4',
    }, expect.any(Function))
    expect(linkedinService.registerVideoUpload).toHaveBeenCalledWith(
      'access-token',
      'urn:li:person:member-1',
      videoBuffer.length,
    )
    expect(linkedinService.uploadBinary).toHaveBeenNthCalledWith(
      1,
      'https://upload.linkedin.example.test/part-1',
      expect.any(Readable),
      5,
    )
    expect(linkedinService.uploadBinary).toHaveBeenNthCalledWith(
      2,
      'https://upload.linkedin.example.test/part-2',
      expect.any(Readable),
      5,
    )
    expect(await readStream(linkedinService.uploadBinary.mock.calls[0][1])).toEqual(Buffer.from('video'))
    expect(await readStream(linkedinService.uploadBinary.mock.calls[1][1])).toEqual(Buffer.from('-data'))
    expect(linkedinService.finalizeVideoUpload).toHaveBeenCalledWith(
      'access-token',
      'urn:li:video:video-1',
      '',
      ['etag-part-1', 'etag-part-2'],
    )
    expect(linkedinService.createVideoPost).toHaveBeenCalledWith(
      'access-token',
      'urn:li:person:member-1',
      'caption',
      'urn:li:video:video-1',
    )
  })

  it('keeps the raw initialize response when upload token is missing', async () => {
    const { provider, linkedinService } = createProvider()
    const initResponse = {
      value: {
        video: 'urn:li:video:video-1',
        uploadInstructions: [{
          uploadUrl: 'https://upload.linkedin.example.test/part-1',
          firstByte: 0,
          lastByte: 9,
        }],
      },
    }
    linkedinService.registerVideoUpload.mockResolvedValueOnce(initResponse)

    await expect(provider.publish(createVideoPublishInput())).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformResponseInvalid,
      platformCause: {
        type: PlatformErrorCauseType.Validation,
        raw: initResponse,
      },
    })
    expect(linkedinService.uploadBinary).not.toHaveBeenCalled()
    expect(linkedinService.finalizeVideoUpload).not.toHaveBeenCalled()
    expect(linkedinService.createVideoPost).not.toHaveBeenCalled()
  })
})
