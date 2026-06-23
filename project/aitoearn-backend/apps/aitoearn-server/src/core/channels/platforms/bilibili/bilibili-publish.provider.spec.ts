import type { BilibiliService } from './bilibili.service'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PublishValidationField, PublishValidationIssueCode } from '../publish.schema'
import { BilibiliPublishProvider } from './bilibili-publish.provider'
import { BilibiliArchiveReviewState } from './bilibili.interface'

vi.mock('@yikart/assets', () => ({
  AssetsService: class AssetsService {},
  VideoMetadataService: class VideoMetadataService {},
}))

vi.mock('@yikart/mongodb', () => ({
  AssetType: {
    AiImage: 'aiImage',
    AiVideo: 'aiVideo',
    AiCard: 'aiCard',
    AiChatImage: 'aiChatImage',
    AideoOutput: 'aideoOutput',
    VideoEdit: 'videoEdit',
    DramaRecap: 'dramaRecap',
    StyleTransfer: 'styleTransfer',
    ImageEdit: 'imageEdit',
    Subtitle: 'subtitle',
    UserMedia: 'userMedia',
    UserFile: 'userFile',
    PublishMedia: 'publishMedia',
    Avatar: 'avatar',
    AgentSession: 'agentSession',
    VideoThumbnail: 'videoThumbnail',
    GooglePlace: 'googlePlace',
    Temp: 'temp',
  },
}))

describe('bilibili publish provider validation', () => {
  it('requires topic tags parsed from the body', async () => {
    const provider = new BilibiliPublishProvider({} as BilibiliService)

    const result = await provider.validate({
      platform: AccountType.Bilibili,
      accountId: 'account-id',
      content: {
        title: 'a'.repeat(80),
        body: 'b'.repeat(250),
        media: [],
      },
    })

    expect(result.valid).toBe(false)
    expect(result.issues).toEqual([
      {
        code: PublishValidationIssueCode.Required,
        path: ['content', 'topics'],
        params: { field: PublishValidationField.Topic },
      },
    ])
  })

  it('validates official tag total length limit from body hashtags', async () => {
    const provider = new BilibiliPublishProvider({} as BilibiliService)

    const result = await provider.validate({
      platform: AccountType.Bilibili,
      accountId: 'account-id',
      content: {
        title: 'title',
        body: `#${'a'.repeat(100)} #${'b'.repeat(99)}`,
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
    })

    expect(result.valid).toBe(false)
    expect(result.issues).toEqual(expect.arrayContaining([
      {
        code: PublishValidationIssueCode.TooBig,
        path: ['content', 'topics'],
        params: { field: PublishValidationField.Topic, maximum: 199, unit: 'characters' },
      },
    ]))
  })
})

describe('bilibili publish provider completion', () => {
  it('keeps submitted resource id as pending lookup metadata', async () => {
    const bilibiliService = {
      submitArchive: vi.fn(async () => ({ resourceId: 'resource-123' })),
    }
    const provider = new BilibiliPublishProvider(bilibiliService as unknown as BilibiliService)

    const result = await provider.publish({
      taskId: 'task-1',
      platform: AccountType.Bilibili,
      accountId: 'account-1',
      credential: { accessToken: 'access-token' },
      content: {
        title: 'Video title',
        body: 'Video description #tag',
        media: [{ url: 'https://cdn.example.test/video.mp4' }],
      },
      option: { tid: 21, copyright: 1 },
    })

    expect(bilibiliService.submitArchive).toHaveBeenCalledWith('access-token', expect.objectContaining({
      description: 'Video description',
      topics: ['tag'],
    }))
    expect(result).toEqual({
      status: 202,
      platformWorkId: 'resource-123',
      dataOption: { resourceId: 'resource-123' },
    })
  })

  it('keeps finalize pending when archive detail is open but has no public video id', async () => {
    const bilibiliService = {
      getArchiveDetail: vi.fn(async () => ({
        resourceId: 'resource-123',
        title: 'Video title',
        state: BilibiliArchiveReviewState.Open,
        stateDesc: '已开放浏览',
      })),
    }
    const provider = new BilibiliPublishProvider(bilibiliService as unknown as BilibiliService)

    const result = await provider.finalize({
      taskId: 'task-1',
      platform: AccountType.Bilibili,
      platformWorkId: 'resource-123',
      mediaJobs: [],
      dataOption: { resourceId: 'resource-123' },
      credential: { accessToken: 'access-token' },
    })

    expect(result).toEqual({
      status: 202,
      platformWorkId: 'resource-123',
      mediaJobs: [],
      dataOption: { resourceId: 'resource-123' },
    })
  })

  it('finalizes with the public video id and canonical work link', async () => {
    const bilibiliService = {
      getArchiveDetail: vi.fn(async () => ({
        resourceId: 'BV1xx411c7mD',
        title: 'Video title',
        state: BilibiliArchiveReviewState.Open,
        stateDesc: '已开放浏览',
      })),
    }
    const provider = new BilibiliPublishProvider(bilibiliService as unknown as BilibiliService)

    const result = await provider.finalize({
      taskId: 'task-1',
      platform: AccountType.Bilibili,
      platformWorkId: 'resource-123',
      mediaJobs: [],
      dataOption: { resourceId: 'resource-123' },
      credential: { accessToken: 'access-token' },
    })

    expect(result).toEqual({
      status: 200,
      platformWorkId: 'BV1xx411c7mD',
      permalink: 'https://www.bilibili.com/video/BV1xx411c7mD',
      dataOption: {
        resourceId: 'resource-123',
        finalVideoId: 'BV1xx411c7mD',
      },
    })
  })
})
