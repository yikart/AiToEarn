import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { FacebookContentCategory } from './facebook.enum'
import { FacebookService } from './facebook.service'

vi.mock('../../media/media.service', () => ({
  MediaService: class {},
}))

function createService() {
  const video = Buffer.from('video')
  const mediaService = {
    withUploadSource: vi.fn(async (_input, handler) => handler({
      sizeBytes: video.length,
      contentType: 'video/mp4',
      filename: 'video.mp4',
      stream: range => Readable.from(video.subarray(range?.start ?? 0, range ? range.end + 1 : video.length)),
      blob: async range => new Blob([new Uint8Array(video.subarray(range?.start ?? 0, range ? range.end + 1 : video.length))], { type: 'video/mp4' }),
    })),
  }
  const service = new FacebookService(
    {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://api.example.test/callback',
      logoUrl: 'https://assets.example.test/facebook.svg',
      graphApiVersion: 'v25.0',
      scopes: [],
    } as never,
    mediaService as never,
  )
  return { service, mediaService }
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
  service: FacebookService,
  adapter: (
    config: InternalAxiosRequestConfig,
  ) => Promise<AxiosResponse<unknown>>,
) {
  const serviceWithHttp = service as unknown as {
    http: {
      defaults: {
        adapter: (
          config: InternalAxiosRequestConfig,
        ) => Promise<AxiosResponse<unknown>>
      }
    }
  }
  serviceWithHttp.http.defaults.adapter = adapter
}

describe('facebook service stories', () => {
  it('publishes photo stories from unpublished page photos', async () => {
    const { service } = createService()
    const requestedUrls: string[] = []

    setAdapter(service, async (config) => {
      requestedUrls.push(config.url ?? '')

      if (config.url === 'https://graph.facebook.com/v25.0/page-id/photos') {
        expect(config.method).toBe('post')
        expect(config.params).toEqual({
          url: 'https://cdn.example.test/story.jpg',
          published: 'false',
          access_token: 'page-token',
        })
        return createResponse({ id: 'photo-id' }, config)
      }

      expect(config.url).toBe(
        'https://graph.facebook.com/v25.0/page-id/photo_stories',
      )
      expect(config.method).toBe('post')
      expect(config.params).toEqual({
        photo_id: 'photo-id',
        access_token: 'page-token',
      })
      return createResponse(
        {
          post_id: 'story-id',
        },
        config,
      )
    })

    await expect(
      service.publishPhotoStory('page-token', 'page-id', {
        imageUrl: 'https://cdn.example.test/story.jpg',
      }),
    ).resolves.toEqual({
      postId: 'story-id',
      photoId: 'photo-id',
    })
    expect(requestedUrls).toEqual([
      'https://graph.facebook.com/v25.0/page-id/photos',
      'https://graph.facebook.com/v25.0/page-id/photo_stories',
    ])
  })

  it('publishes video stories with start upload and finish phases', async () => {
    const { service, mediaService } = createService()
    const requestedUrls: string[] = []

    setAdapter(service, async (config) => {
      requestedUrls.push(config.url ?? '')

      if (
        config.url
        === 'https://graph.facebook.com/v25.0/page-id/video_stories'
        && config.params?.upload_phase === 'start'
      ) {
        expect(config.method).toBe('post')
        expect(config.params).toEqual({
          upload_phase: 'start',
          access_token: 'page-token',
        })
        return createResponse(
          {
            video_id: 'video-id',
            upload_url: 'https://upload.facebook.test/story',
          },
          config,
        )
      }

      if (config.url === 'https://upload.facebook.test/story') {
        expect(config.method).toBe('post')
        expect(config.headers.Authorization).toBe('OAuth page-token')
        expect(config.headers.offset).toBe('0')
        expect(config.headers.file_size).toBe('5')
        return createResponse({}, config)
      }

      expect(config.url).toBe(
        'https://graph.facebook.com/v25.0/page-id/video_stories',
      )
      expect(config.method).toBe('post')
      expect(config.params).toEqual({
        upload_phase: 'finish',
        video_id: 'video-id',
        content_category: FacebookContentCategory.Story,
        access_token: 'page-token',
      })
      return createResponse({ post_id: 'story-post-id' }, config)
    })

    await expect(
      service.publishVideoStory('page-token', 'page-id', {
        videoUrl: 'https://cdn.example.test/story.mp4',
        contentCategory: FacebookContentCategory.Story,
      }),
    ).resolves.toEqual({
      postId: 'story-post-id',
      videoId: 'video-id',
    })
    expect(mediaService.withUploadSource).toHaveBeenCalledWith({
      platform: 'facebook',
      endpoint: 'publishVideoStory.downloadMedia',
      url: 'https://cdn.example.test/story.mp4',
    }, expect.any(Function))
    expect(requestedUrls).toEqual([
      'https://graph.facebook.com/v25.0/page-id/video_stories',
      'https://upload.facebook.test/story',
      'https://graph.facebook.com/v25.0/page-id/video_stories',
    ])
  })

  it('returns and validates the finish response when publishing reels', async () => {
    const { service, mediaService } = createService()

    setAdapter(service, async (config) => {
      if (
        config.url === 'https://graph.facebook.com/v25.0/page-id/video_reels'
        && config.params?.upload_phase === 'start'
      ) {
        return createResponse(
          {
            video_id: 'video-id',
            upload_url: 'https://upload.facebook.test/reel',
          },
          config,
        )
      }

      if (config.url === 'https://upload.facebook.test/reel') {
        expect(config.method).toBe('post')
        expect(config.headers.Authorization).toBe('OAuth page-token')
        return createResponse({}, config)
      }

      expect(config.url).toBe(
        'https://graph.facebook.com/v25.0/page-id/video_reels',
      )
      expect(config.params).toEqual({
        upload_phase: 'finish',
        video_id: 'video-id',
        video_state: 'PUBLISHED',
        access_token: 'page-token',
        description: 'reel description',
        content_category: FacebookContentCategory.Reel,
      })
      return createResponse({ success: true }, config)
    })

    await expect(
      service.publishReel('page-token', 'page-id', {
        videoUrl: 'https://cdn.example.test/reel.mp4',
        description: 'reel description',
        contentCategory: FacebookContentCategory.Reel,
      }),
    ).resolves.toEqual({
      videoId: 'video-id',
    })
    expect(mediaService.withUploadSource).toHaveBeenCalledWith({
      platform: 'facebook',
      endpoint: 'publishReel.downloadMedia',
      url: 'https://cdn.example.test/reel.mp4',
    }, expect.any(Function))
  })

  it('requests only the documented video status fields needed by finalize', async () => {
    const { service } = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://graph.facebook.com/v25.0/video-id')
      expect(config.method).toBe('get')
      expect(config.params).toEqual({
        fields: 'id,status',
        access_token: 'page-token',
      })
      return createResponse(
        {
          id: 'video-id',
          status: { video_status: 'ready' },
        },
        config,
      )
    })

    await expect(
      service.getVideoStatus('page-token', 'video-id'),
    ).resolves.toEqual({
      id: 'video-id',
      status: 'ready',
    })
  })

  it('publishes page videos with post content category', async () => {
    const { service, mediaService } = createService()

    setAdapter(service, async (config) => {
      if (
        config.url === 'https://graph.facebook.com/v25.0/page-id/videos'
        && config.params?.upload_phase === 'start'
      ) {
        return createResponse(
          {
            upload_session_id: 'session-id',
          },
          config,
        )
      }

      if (
        config.url === 'https://graph.facebook.com/v25.0/page-id/videos'
        && config.params?.upload_phase === 'transfer'
      ) {
        expect(config.method).toBe('post')
        expect(config.params).toEqual({
          upload_phase: 'transfer',
          upload_session_id: 'session-id',
          start_offset: 0,
          access_token: 'page-token',
        })
        return createResponse({}, config)
      }

      expect(config.url).toBe(
        'https://graph.facebook.com/v25.0/page-id/videos',
      )
      expect(config.params).toEqual({
        upload_phase: 'finish',
        upload_session_id: 'session-id',
        access_token: 'page-token',
        title: 'video title',
        description: 'video description',
        content_category: FacebookContentCategory.Post,
      })
      return createResponse({ id: 'video-post-id' }, config)
    })

    await expect(
      service.publishVideoPost('page-token', 'page-id', {
        title: 'video title',
        description: 'video description',
        videoUrl: 'https://cdn.example.test/video.mp4',
        contentCategory: FacebookContentCategory.Post,
      }),
    ).resolves.toEqual({ id: 'video-post-id' })
    expect(mediaService.withUploadSource).toHaveBeenCalledWith({
      platform: 'facebook',
      endpoint: 'publishVideoPost.downloadMedia',
      url: 'https://cdn.example.test/video.mp4',
    }, expect.any(Function))
  })
})

describe('facebook service page publishing', () => {
  it('publishes feed posts and returns only the page post id', async () => {
    const { service } = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://graph.facebook.com/v25.0/page-id/feed')
      expect(config.method).toBe('post')
      expect(config.params).toEqual({
        message: 'feed message',
        link: 'https://example.test',
        access_token: 'page-token',
      })
      return createResponse({ id: 'page-post-id' }, config)
    })

    await expect(
      service.createFeedPost('page-token', 'page-id', {
        message: 'feed message',
        link: 'https://example.test',
      }),
    ).resolves.toEqual({ id: 'page-post-id' })
  })

  it('publishes photo posts and returns the photo id plus page post id', async () => {
    const { service } = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://graph.facebook.com/v25.0/page-id/photos')
      expect(config.method).toBe('post')
      expect(config.params).toEqual({
        url: 'https://cdn.example.test/photo.jpg',
        message: 'photo message',
        access_token: 'page-token',
      })
      return createResponse(
        {
          id: 'photo-id',
          post_id: 'page-post-id',
        },
        config,
      )
    })

    await expect(
      service.createFeedPost('page-token', 'page-id', {
        message: 'photo message',
        imageUrl: 'https://cdn.example.test/photo.jpg',
      }),
    ).resolves.toEqual({
      id: 'photo-id',
      post_id: 'page-post-id',
    })
  })

  it('publishes multi-photo feed posts and returns the final page post id', async () => {
    const { service } = createService()
    const requestedUrls: string[] = []

    setAdapter(service, async (config) => {
      requestedUrls.push(config.url ?? '')

      if (config.url === 'https://graph.facebook.com/v25.0/page-id/photos') {
        expect(config.method).toBe('post')
        expect(config.params).toMatchObject({
          published: 'false',
          access_token: 'page-token',
        })
        return createResponse(
          {
            id:
              config.params.url === 'https://cdn.example.test/photo-1.jpg'
                ? 'photo-id-1'
                : 'photo-id-2',
          },
          config,
        )
      }

      expect(config.url).toBe('https://graph.facebook.com/v25.0/page-id/feed')
      expect(config.method).toBe('post')
      expect(JSON.parse(config.data as string)).toEqual({
        attached_media: [
          { media_fbid: 'photo-id-1' },
          { media_fbid: 'photo-id-2' },
        ],
        message: 'multi-photo message',
      })
      expect(config.params).toEqual({ access_token: 'page-token' })
      return createResponse({ id: 'page-post-id' }, config)
    })

    await expect(
      service.createMultiPhotoPost('page-token', 'page-id', {
        message: 'multi-photo message',
        imageUrls: [
          'https://cdn.example.test/photo-1.jpg',
          'https://cdn.example.test/photo-2.jpg',
        ],
      }),
    ).resolves.toEqual({ id: 'page-post-id' })
    expect(requestedUrls).toEqual([
      'https://graph.facebook.com/v25.0/page-id/photos',
      'https://graph.facebook.com/v25.0/page-id/photos',
      'https://graph.facebook.com/v25.0/page-id/feed',
    ])
  })
})

describe('facebook service works list', () => {
  it('requests attachment media fields for page posts', async () => {
    const { service } = createService()

    setAdapter(service, async (config) => {
      expect(config.url).toBe('https://graph.facebook.com/v25.0/page-id/posts')
      expect(config.method).toBe('get')
      expect(config.params).toEqual({
        fields:
          'id,message,created_time,permalink_url,full_picture,type,status_type,attachments{media_type,type,media,subattachments{media_type,type,media}}',
        limit: 10,
        access_token: 'page-token',
      })
      return createResponse({ data: [] }, config)
    })

    await expect(
      service.listPagePosts('page-token', 'page-id', { limit: 10 }),
    ).resolves.toEqual({ data: [] })
  })
})
