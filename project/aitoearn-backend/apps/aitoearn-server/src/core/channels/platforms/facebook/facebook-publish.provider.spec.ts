import { describe, expect, it, vi } from 'vitest'
import {
  PublishValidationCombination,
  PublishValidationIssueCode,
} from '../publish.schema'
import { FacebookPublishProvider } from './facebook-publish.provider'
import { FacebookDataOptionSchema } from './facebook.interface'
import { FacebookContentCategory } from './facebook.schema'

vi.mock('./facebook.service', () => ({
  FacebookService: class {},
}))

function createProvider() {
  const facebookService = {
    createFeedPost: vi.fn(),
    createMultiPhotoPost: vi.fn(),
    getPostInfo: vi
      .fn()
      .mockResolvedValue({
        id: 'post-id',
        permalinkUrl: 'https://facebook.com/post-id',
      }),
    publishReel: vi.fn().mockResolvedValue({
      videoId: 'reel-video-id',
    }),
    publishVideoPost: vi.fn(),
    publishPhotoStory: vi.fn().mockResolvedValue({
      postId: 'story-id',
      photoId: 'photo-id',
    }),
    publishVideoStory: vi.fn().mockResolvedValue({
      postId: 'story-post-id',
      videoId: 'story-video-id',
    }),
    getVideoStatus: vi.fn(),
    deletePost: vi.fn(),
  }
  return {
    provider: new FacebookPublishProvider(facebookService as never),
    facebookService,
  }
}

const baseInput = {
  platform: 'facebook' as never,
  accountId: 'account-id',
  content: { media: [] },
}

describe('facebook publish provider validation', () => {
  it('does not apply Reel duration limits to normal video posts', async () => {
    const { provider } = createProvider()

    const result = await provider.validate({
      ...baseInput,
      content: {
        body: 'normal page video',
        media: [
          {
            url: 'https://cdn.example.test/video.mp4',
            metadata: { durationSec: 180 },
          },
        ],
      },
      option: { content_category: FacebookContentCategory.Post },
    })

    expect(result.valid).toBe(true)
  })

  it('requires exactly one video for Reels and rejects images', async () => {
    const { provider } = createProvider()

    const result = await provider.validate({
      ...baseInput,
      content: {
        media: [
          { url: 'https://cdn.example.test/image.jpg' },
          {
            url: 'https://cdn.example.test/video.mp4',
            metadata: { durationSec: 120 },
          },
        ],
      },
      option: { content_category: FacebookContentCategory.Reel },
    })

    expect(result.valid).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: PublishValidationIssueCode.InvalidCombination,
          params: { combination: PublishValidationCombination.ReelImage },
        }),
      ]),
    )
  })

  it('rejects story text and multiple media items', async () => {
    const { provider } = createProvider()

    const result = await provider.validate({
      ...baseInput,
      content: {
        body: 'story text is not accepted',
        media: [
          { url: 'https://cdn.example.test/image-1.jpg' },
          { url: 'https://cdn.example.test/image-2.jpg' },
        ],
      },
      option: { content_category: FacebookContentCategory.Story },
    })

    expect(result.valid).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: PublishValidationIssueCode.TooBig }),
        expect.objectContaining({
          code: PublishValidationIssueCode.InvalidOption,
        }),
      ]),
    )
  })

  it('resolves content-category-specific media rules for common media validation', () => {
    const { provider } = createProvider()

    expect(
      provider.resolveMediaRules({
        ...baseInput,
        option: { content_category: FacebookContentCategory.Post },
      }),
    ).toMatchObject({
      videoFormats: ['mp4', 'mov', 'avi'],
      maxVideoSize: 1024 * 1024 * 1024,
    })
    expect(
      provider.resolveMediaRules({
        ...baseInput,
        option: { content_category: FacebookContentCategory.Reel },
      }),
    ).toMatchObject({
      videoFormats: ['mp4'],
      minVideoDuration: 3,
      maxVideoDuration: 90,
    })
    expect(
      provider.resolveMediaRules({
        ...baseInput,
        option: { content_category: FacebookContentCategory.Story },
      }),
    ).toMatchObject({
      videoFormats: ['mp4', 'mov'],
      maxImageSize: 4 * 1024 * 1024,
      minVideoDuration: 3,
      maxVideoDuration: 60,
    })
  })
})

describe('facebook publish provider routing', () => {
  it('publishes feed posts without a page tasks precheck', async () => {
    const { provider, facebookService } = createProvider()
    facebookService.createFeedPost.mockResolvedValueOnce({
      id: 'photo-id',
      post_id: 'feed-post-id',
    })

    const result = await provider.publish({
      taskId: 'task-id',
      platform: 'facebook' as never,
      accountId: 'account-id',
      content: {
        body: 'feed caption',
        media: [{ url: 'https://cdn.example.test/feed.jpg' }],
      },
      option: { content_category: FacebookContentCategory.Post },
      credential: { accessToken: 'page-token', platformUid: 'page-id' },
    })

    expect(facebookService.createFeedPost).toHaveBeenCalledWith(
      'page-token',
      'page-id',
      {
        message: 'feed caption',
        imageUrl: 'https://cdn.example.test/feed.jpg',
      },
    )
    expect(result).toMatchObject({
      status: 200,
      platformWorkId: 'feed-post-id',
      permalink: 'https://www.facebook.com/feed-post-id',
    })
    expect(facebookService.getPostInfo).not.toHaveBeenCalled()
  })

  it('publishes multi-photo feed posts with the final feed id URL', async () => {
    const { provider, facebookService } = createProvider()
    facebookService.createMultiPhotoPost.mockResolvedValueOnce({
      id: 'multi-feed-post-id',
    })

    const result = await provider.publish({
      taskId: 'task-id',
      platform: 'facebook' as never,
      accountId: 'account-id',
      content: {
        body: 'feed caption',
        media: [
          { url: 'https://cdn.example.test/feed-1.jpg' },
          { url: 'https://cdn.example.test/feed-2.jpg' },
        ],
      },
      option: { content_category: FacebookContentCategory.Post },
      credential: { accessToken: 'page-token', platformUid: 'page-id' },
    })

    expect(facebookService.createMultiPhotoPost).toHaveBeenCalledWith(
      'page-token',
      'page-id',
      {
        message: 'feed caption',
        imageUrls: [
          'https://cdn.example.test/feed-1.jpg',
          'https://cdn.example.test/feed-2.jpg',
        ],
      },
    )
    expect(result).toMatchObject({
      status: 200,
      platformWorkId: 'multi-feed-post-id',
      permalink: 'https://www.facebook.com/multi-feed-post-id',
    })
    expect(facebookService.getPostInfo).not.toHaveBeenCalled()
  })

  it('publishes photo stories through the story endpoint', async () => {
    const { provider, facebookService } = createProvider()

    const result = await provider.publish({
      taskId: 'task-id',
      platform: 'facebook' as never,
      accountId: 'account-id',
      content: { media: [{ url: 'https://cdn.example.test/story.jpg' }] },
      option: { content_category: FacebookContentCategory.Story },
      credential: { accessToken: 'page-token', platformUid: 'page-id' },
    })

    expect(facebookService.publishPhotoStory).toHaveBeenCalledWith(
      'page-token',
      'page-id',
      { imageUrl: 'https://cdn.example.test/story.jpg' },
    )
    expect(result).toMatchObject({
      status: 200,
      platformWorkId: 'story-id',
      permalink: 'https://www.facebook.com/story-id',
      dataOption: {
        content_category: FacebookContentCategory.Story,
        postId: 'story-id',
        photoId: 'photo-id',
      },
    })
  })

  it('publishes Reels through the reel endpoint and records media finalize data option', async () => {
    const { provider, facebookService } = createProvider()

    const result = await provider.publish({
      taskId: 'task-id',
      platform: 'facebook' as never,
      accountId: 'account-id',
      content: {
        body: 'caption',
        media: [{ url: 'https://cdn.example.test/reel.mp4' }],
      },
      option: { content_category: FacebookContentCategory.Reel },
      credential: { accessToken: 'page-token', platformUid: 'page-id' },
    })

    expect(facebookService.publishReel).toHaveBeenCalledWith(
      'page-token',
      'page-id',
      {
        videoUrl: 'https://cdn.example.test/reel.mp4',
        description: 'caption',
        contentCategory: FacebookContentCategory.Reel,
      },
    )
    expect(result).toMatchObject({
      platformWorkId: 'reel-video-id',
      permalink: 'https://www.facebook.com/reel/reel-video-id',
      dataOption: {
        content_category: FacebookContentCategory.Reel,
        videoId: 'reel-video-id',
      },
      mediaJobs: [
        expect.objectContaining({
          mediaId: 'reel-video-id',
        }),
      ],
    })
  })

  it('uses the upload video id for video story media finalize', async () => {
    const { provider, facebookService } = createProvider()

    const result = await provider.publish({
      taskId: 'task-id',
      platform: 'facebook' as never,
      accountId: 'account-id',
      content: { media: [{ url: 'https://cdn.example.test/story.mp4' }] },
      option: { content_category: FacebookContentCategory.Story },
      credential: { accessToken: 'page-token', platformUid: 'page-id' },
    })

    expect(facebookService.publishVideoStory).toHaveBeenCalledWith(
      'page-token',
      'page-id',
      {
        videoUrl: 'https://cdn.example.test/story.mp4',
        contentCategory: FacebookContentCategory.Story,
      },
    )
    expect(result).toMatchObject({
      platformWorkId: 'story-post-id',
      permalink: 'https://www.facebook.com/story-post-id',
      dataOption: {
        content_category: FacebookContentCategory.Story,
        postId: 'story-post-id',
        videoId: 'story-video-id',
      },
      mediaJobs: [
        expect.objectContaining({
          mediaId: 'story-video-id',
        }),
      ],
    })
  })

  it('publishes Reels with the video id and canonical reel URL after media processing', async () => {
    const { provider, facebookService } = createProvider()
    facebookService.getVideoStatus.mockResolvedValueOnce({
      id: 'reel-video-id',
      status: 'ready',
    })

    const result = await provider.finalize({
      taskId: 'task-id',
      platform: 'facebook' as never,
      platformWorkId: 'reel-post-id',
      mediaJobs: [
        {
          mediaId: 'reel-video-id',
          type: 'video',
          url: 'https://cdn.example.test/reel.mp4',
        },
      ],
      dataOption: {
        content_category: FacebookContentCategory.Reel,
      },
      credential: { accessToken: 'page-token', platformUid: 'page-id' },
    })

    expect(facebookService.getVideoStatus).toHaveBeenCalledWith(
      'page-token',
      'reel-video-id',
    )
    expect(facebookService.getPostInfo).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      status: 200,
      platformWorkId: 'reel-video-id',
      permalink: 'https://www.facebook.com/reel/reel-video-id',
      dataOption: {
        content_category: FacebookContentCategory.Reel,
        videoId: 'reel-video-id',
      },
    })
  })

  it('uses the Graph permalink when verify confirms a Facebook object', async () => {
    const { provider, facebookService } = createProvider()
    facebookService.getPostInfo.mockResolvedValueOnce({
      id: 'video-post-id',
      permalinkUrl: 'https://www.facebook.com/page/videos/video-post-id/',
    })

    await expect(provider.verify({
      taskId: 'task-id',
      platform: 'facebook' as never,
      platformWorkId: 'video-post-id',
      dataOption: {
        content_category: FacebookContentCategory.Post,
        videoId: 'video-post-id',
      },
      credential: { accessToken: 'page-token', platformUid: 'page-id' },
    })).resolves.toEqual({
      published: true,
      platformWorkId: 'video-post-id',
      permalink: 'https://www.facebook.com/page/videos/video-post-id/',
    })
  })

  it('does not mark Facebook verify as published when Graph has no permalink', async () => {
    const { provider, facebookService } = createProvider()
    facebookService.getPostInfo.mockResolvedValueOnce({
      id: 'story-post-id',
    })

    await expect(provider.verify({
      taskId: 'task-id',
      platform: 'facebook' as never,
      platformWorkId: 'story-post-id',
      dataOption: {
        content_category: FacebookContentCategory.Story,
        postId: 'story-post-id',
      },
      credential: { accessToken: 'page-token', platformUid: 'page-id' },
    })).resolves.toEqual({
      published: false,
      platformWorkId: 'story-post-id',
    })
  })

  it('rejects null permalinkUrl in Facebook data option', () => {
    expect(() =>
      FacebookDataOptionSchema.parse({
        content_category: FacebookContentCategory.Reel,
        permalinkUrl: null,
      }),
    ).toThrow()
  })

  it('publishes video stories with the returned post id and no permalink requirement', async () => {
    const { provider, facebookService } = createProvider()
    facebookService.getVideoStatus.mockResolvedValueOnce({
      id: 'story-video-id',
      status: 'published',
    })

    const result = await provider.finalize({
      taskId: 'task-id',
      platform: 'facebook' as never,
      platformWorkId: 'story-post-id',
      mediaJobs: [
        {
          mediaId: 'story-video-id',
          type: 'video',
          url: 'https://cdn.example.test/story.mp4',
        },
      ],
      dataOption: {
        content_category: FacebookContentCategory.Story,
        postId: 'story-post-id',
        videoId: 'story-video-id',
      },
      credential: { accessToken: 'page-token', platformUid: 'page-id' },
    })

    expect(result).toMatchObject({
      status: 200,
      platformWorkId: 'story-post-id',
      permalink: 'https://www.facebook.com/story-post-id',
      dataOption: {
        content_category: FacebookContentCategory.Story,
        postId: 'story-post-id',
        videoId: 'story-video-id',
      },
    })
  })

  it('publishes normal videos with the video id and canonical reel URL', async () => {
    const { provider, facebookService } = createProvider()
    facebookService.publishVideoPost.mockResolvedValueOnce({
      id: 'video-post-id',
    })

    const result = await provider.publish({
      taskId: 'task-id',
      platform: 'facebook' as never,
      accountId: 'account-id',
      content: {
        title: 'Video title',
        body: 'Video description',
        media: [{ url: 'https://cdn.example.test/video.mp4' }],
      },
      option: { content_category: FacebookContentCategory.Post },
      credential: { accessToken: 'page-token', platformUid: 'page-id' },
    })

    expect(facebookService.publishVideoPost).toHaveBeenCalledWith(
      'page-token',
      'page-id',
      {
        title: 'Video title',
        description: 'Video description',
        videoUrl: 'https://cdn.example.test/video.mp4',
        contentCategory: FacebookContentCategory.Post,
      },
    )
    expect(facebookService.getPostInfo).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      status: 200,
      platformWorkId: 'video-post-id',
      permalink: 'https://www.facebook.com/reel/video-post-id',
      dataOption: {
        content_category: FacebookContentCategory.Post,
        videoId: 'video-post-id',
      },
    })
  })

  it('routes extensionless media as video when metadata declares video', async () => {
    const { provider, facebookService } = createProvider()
    facebookService.publishVideoPost.mockResolvedValueOnce({
      id: 'video-post-id',
    })

    await provider.publish({
      taskId: 'task-id',
      platform: 'facebook' as never,
      accountId: 'account-id',
      content: {
        title: 'Video title',
        body: 'Video description',
        media: [{ url: 'https://cdn.example.test/signed-media', metadata: { type: 'video' } }],
      },
      option: { content_category: FacebookContentCategory.Post },
      credential: { accessToken: 'page-token', platformUid: 'page-id' },
    })

    expect(facebookService.publishVideoPost).toHaveBeenCalledWith(
      'page-token',
      'page-id',
      expect.objectContaining({
        videoUrl: 'https://cdn.example.test/signed-media',
      }),
    )
    expect(facebookService.createFeedPost).not.toHaveBeenCalled()
  })
})
