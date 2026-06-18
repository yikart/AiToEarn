import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PublishValidationField, PublishValidationIssueCode } from '../publish.schema'
import { ThreadsPublishProvider } from './threads-publish.provider'
import { THREADS_METADATA } from './threads.constants'
import { ThreadsContainerStatusCode, ThreadsMediaType, ThreadsPublishResultStatus } from './threads.interface'
import { ThreadsReplyControl } from './threads.schema'

function createProvider() {
  const threadsService = {
    createContainer: vi.fn(async () => ({ id: 'container-1' })),
    getContainerStatus: vi.fn(async () => ({
      id: 'container-1',
      status: ThreadsContainerStatusCode.Finished,
    })),
    publishContainer: vi.fn(async () => ({ id: 'thread-1' })),
    getPublishedPost: vi.fn(async () => ({
      id: 'thread-1',
      permalink: 'https://www.threads.com/@user/post/thread-1',
    })),
  }

  return {
    provider: new ThreadsPublishProvider(threadsService as never),
    threadsService,
  }
}

function createPublishInput(input?: {
  body?: string
  media?: Array<{ url: string, metadata?: { type?: string } }>
  option?: {
    auto_publish_text?: boolean
    reply_control?: ThreadsReplyControl
  }
}) {
  return {
    taskId: 'task-1',
    platform: AccountType.Threads,
    accountId: 'account-1',
    content: {
      body: input?.body ?? 'hello #ai',
      media: input?.media ?? [],
    },
    option: input?.option,
    credential: {
      accessToken: 'access-token',
      platformUid: 'threads-user-id',
    },
  }
}

describe('threads publish provider', () => {
  it('keeps Threads video metadata limit at 1GB', () => {
    expect(THREADS_METADATA.mediaRules.maxVideoSize).toBe(1024 * 1024 * 1024)
  })

  it('derives topic_tag from body and strips it from text posts', async () => {
    const { provider, threadsService } = createProvider()

    await provider.publish(createPublishInput({ body: 'hello #ai' }))

    expect(threadsService.createContainer).toHaveBeenCalledWith(
      'threads-user-id',
      'access-token',
      {
        mediaType: ThreadsMediaType.Text,
        text: 'hello',
        topicTag: 'ai',
      },
    )
  })

  it('maps text auto-publish and the full reply control enum to the container request', async () => {
    const { provider, threadsService } = createProvider()

    await provider.publish(createPublishInput({
      body: 'hello',
      option: {
        auto_publish_text: true,
        reply_control: ThreadsReplyControl.FollowersOnly,
      },
    }))

    expect(threadsService.createContainer).toHaveBeenCalledWith(
      'threads-user-id',
      'access-token',
      {
        mediaType: ThreadsMediaType.Text,
        text: 'hello',
        replyControl: ThreadsReplyControl.FollowersOnly,
        autoPublishText: true,
      },
    )
    expect(threadsService.publishContainer).not.toHaveBeenCalled()
    expect(threadsService.getPublishedPost).toHaveBeenCalledWith(
      'container-1',
      'access-token',
      'permalink',
    )
  })

  it('publishes extensionless image media when metadata declares image', async () => {
    const { provider, threadsService } = createProvider()

    await provider.publish(createPublishInput({
      body: 'caption',
      media: [{ url: 'https://cdn.example.test/signed-media', metadata: { type: 'image' } }],
    }))

    expect(threadsService.createContainer).toHaveBeenCalledWith(
      'threads-user-id',
      'access-token',
      expect.objectContaining({
        mediaType: ThreadsMediaType.Image,
        imageUrl: 'https://cdn.example.test/signed-media',
      }),
    )
  })

  it('rejects WebP media instead of falling back to a text post', async () => {
    const { provider, threadsService } = createProvider()

    await expect(provider.validate({
      platform: AccountType.Threads,
      accountId: 'account-1',
      content: {
        body: 'caption',
        media: [{ url: 'https://cdn.example.test/image.webp', metadata: { type: 'image' } }],
      },
    })).resolves.toMatchObject({
      valid: false,
      issues: [expect.objectContaining({
        code: PublishValidationIssueCode.UnsupportedFormat,
      })],
    })

    await expect(provider.publish(createPublishInput({
      body: 'caption',
      media: [{ url: 'https://cdn.example.test/image.webp', metadata: { type: 'image' } }],
    }))).rejects.toMatchObject({
      code: ResponseCode.ChannelPlatformMediaUnsupported,
    })

    expect(threadsService.createContainer).not.toHaveBeenCalled()
  })

  it('keeps stripped text and topic_tag for carousel finalize', async () => {
    const { provider, threadsService } = createProvider()
    threadsService.createContainer
      .mockResolvedValueOnce({ id: 'child-1' })
      .mockResolvedValueOnce({ id: 'child-2' })
      .mockResolvedValueOnce({ id: 'carousel-1' })

    const publishResult = await provider.publish(createPublishInput({
      body: 'caption #ai',
      media: [
        { url: 'https://cdn.example.test/image-1.jpg' },
        { url: 'https://cdn.example.test/image-2.jpg' },
      ],
    }))

    expect(publishResult.dataOption).toMatchObject({
      mediaType: ThreadsMediaType.Carousel,
      text: 'caption',
      topicTag: 'ai',
    })
    expect(publishResult.dataOption).not.toHaveProperty('topics')

    await provider.finalize({
      taskId: 'task-1',
      platform: AccountType.Threads,
      platformWorkId: '',
      mediaJobs: publishResult.mediaJobs!,
      dataOption: publishResult.dataOption,
      credential: {
        accessToken: 'access-token',
        platformUid: 'threads-user-id',
      },
    })

    expect(threadsService.createContainer).toHaveBeenLastCalledWith(
      'threads-user-id',
      'access-token',
      {
        mediaType: ThreadsMediaType.Carousel,
        children: 'child-1,child-2',
        text: 'caption',
        topicTag: 'ai',
      },
    )
  })

  it('requires text content after stripping the derived topic for text-only posts', async () => {
    const { provider } = createProvider()

    const result = await provider.validate({
      platform: AccountType.Threads,
      accountId: 'account-1',
      content: {
        body: '#ai',
        media: [],
      },
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [
        expect.objectContaining({
          code: PublishValidationIssueCode.Required,
          path: ['content', 'body'],
          params: { field: PublishValidationField.Text },
        }),
      ],
    })
  })
})

describe('threads publish provider finalize', () => {
  it('polls container status before fetching the published post permalink', async () => {
    const { provider, threadsService } = createProvider()

    const result = await provider.finalize({
      taskId: 'task-1',
      platform: AccountType.Threads,
      platformWorkId: '',
      mediaJobs: [{
        mediaId: 'container-1',
        type: 'video',
        url: 'https://cdn.example.test/video.mp4',
      }],
      dataOption: { mediaType: ThreadsMediaType.Video },
      credential: {
        accessToken: 'access-token',
        platformUid: 'threads-user-id',
      },
    })

    expect(threadsService.getContainerStatus).toHaveBeenCalledWith('container-1', 'access-token')
    expect(threadsService.publishContainer).toHaveBeenCalledWith(
      'threads-user-id',
      'access-token',
      'container-1',
    )
    expect(threadsService.getPublishedPost).toHaveBeenCalledWith(
      'thread-1',
      'access-token',
      'permalink',
    )
    expect(result).toMatchObject({
      status: ThreadsPublishResultStatus.Published,
      platformWorkId: 'thread-1',
      permalink: 'https://www.threads.com/@user/post/thread-1',
    })
  })
})
