import { AccountType } from '@yikart/common'
import { PublishRecordSource, PublishType } from '@yikart/mongodb'
import { describe, expect, it, vi } from 'vitest'
import { CreatePublishFlowSchema } from './publish-flow.dto'

vi.mock('@yikart/mongodb', () => ({
  PublishRecordSource: {
    Web: 'web',
  },
  PublishType: {
    VIDEO: 'video',
    ARTICLE: 'article',
  },
}))

const baseFlow = {
  content: {
    title: 'Title',
    body: 'Body',
    media: [{ url: 'https://example.com/video.mp4' }],
  },
  publishAt: '2026-05-22T10:00:00.000Z',
}

describe('publish flow dto', () => {
  it('strips option fields that do not belong to the selected platform', () => {
    const result = CreatePublishFlowSchema.safeParse({
      ...baseFlow,
      items: [{
        accountId: 'account-id',
        platform: AccountType.YouTube,
        option: { tid: 21 },
      }],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items[0].option).not.toHaveProperty('tid')
    }
  })

  it('keeps platform required option rules at dto boundary', () => {
    expect(CreatePublishFlowSchema.safeParse({
      ...baseFlow,
      items: [{
        accountId: 'account-id',
        platform: AccountType.Bilibili,
      }],
    }).success).toBe(false)

    expect(CreatePublishFlowSchema.safeParse({
      ...baseFlow,
      items: [{
        accountId: 'account-id',
        platform: AccountType.GoogleBusiness,
        option: {},
      }],
    }).success).toBe(false)
  })

  it('accepts media adaptation options inside media and cover objects', () => {
    const result = CreatePublishFlowSchema.safeParse({
      ...baseFlow,
      content: {
        ...baseFlow.content,
        media: [{
          url: 'https://example.com/image.png',
          options: { adaptation: { imageFormat: 'auto' } },
        }],
        cover: {
          url: 'https://example.com/cover.png',
          options: { adaptation: { imageFormat: 'jpeg' } },
        },
      },
      items: [{
        accountId: 'account-id',
        platform: AccountType.TikTok,
      }],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content.media[0].options?.adaptation?.imageFormat).toBe('auto')
      expect(result.data.content.cover?.options?.adaptation?.imageFormat).toBe('jpeg')
    }
  })

  it('does not expose media adaptation as a platform option', () => {
    const result = CreatePublishFlowSchema.safeParse({
      ...baseFlow,
      items: [{
        accountId: 'account-id',
        platform: AccountType.TikTok,
        option: {
          mediaAdaptation: { imageFormat: 'jpeg' },
        },
      }],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items[0].option).not.toHaveProperty('mediaAdaptation')
    }
  })

  it('requires RedNote workLink in platform option', () => {
    expect(CreatePublishFlowSchema.safeParse({
      ...baseFlow,
      items: [{
        accountId: 'account-id',
        platform: AccountType.RedNote,
        option: { workLink: 'https://www.xiaohongshu.com/explore/note_1' },
      }],
    }).success).toBe(true)

    expect(CreatePublishFlowSchema.safeParse({
      ...baseFlow,
      items: [{
        accountId: 'account-id',
        platform: AccountType.RedNote,
      }],
    }).success).toBe(false)

    expect(CreatePublishFlowSchema.safeParse({
      ...baseFlow,
      items: [{
        accountId: 'account-id',
        platform: AccountType.RedNote,
        option: {},
      }],
    }).success).toBe(false)
  })

  it('accepts legacy publish context fields', () => {
    expect(CreatePublishFlowSchema.safeParse({
      ...baseFlow,
      flowId: 'flow_1',
      context: {
        type: PublishType.VIDEO,
        taskId: 'task_1',
        materialGroupId: 'group_1',
        materialId: 'material_1',
        source: PublishRecordSource.Web,
        videoUrl: 'https://example.com/video.mp4',
      },
      items: [{
        accountId: 'account-id',
        platform: AccountType.YouTube,
      }],
    }).success).toBe(true)
  })

  it('does not expose content.topics as an input contract', () => {
    const result = CreatePublishFlowSchema.safeParse({
      ...baseFlow,
      content: {
        ...baseFlow.content,
        topics: ['topic'],
      },
      items: [{
        accountId: 'account-id',
        platform: AccountType.RedNote,
        option: { workLink: 'https://www.xiaohongshu.com/explore/note_1' },
      }],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).not.toHaveProperty('topics')
    }
  })
})
