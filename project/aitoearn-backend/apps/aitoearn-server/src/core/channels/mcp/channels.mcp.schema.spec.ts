import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { RequestChannelPublishUpdateSchema } from './channels-mcp.schema'

vi.mock('@yikart/mongodb', () => ({
  PublishRecordSource: {
    Mcp: 'mcp',
    Web: 'web',
  },
  PublishStatus: {
    Failed: -1,
    WaitingForPublish: 0,
    Published: 1,
    Publishing: 2,
    PlatformScheduled: 7,
    WaitingForUserAction: 8,
    Canceled: 9,
  },
  PublishType: {
    VIDEO: 'video',
    ARTICLE: 'article',
  },
}))

describe('requestChannelPublishUpdateSchema', () => {
  it('accepts structured update data', () => {
    expect(RequestChannelPublishUpdateSchema.parse({
      taskId: 'task-1',
      platform: AccountType.Facebook,
      accountId: 'account-1',
      data: {
        content: {
          title: 'updated title',
          body: 'updated body',
          media: [{ url: 'https://assets.example.test/image.jpg' }],
        },
        option: {
          content_category: 'post',
        },
      },
    })).toMatchObject({
      taskId: 'task-1',
      data: {
        content: {
          title: 'updated title',
          body: 'updated body',
          media: [{ url: 'https://assets.example.test/image.jpg' }],
        },
        option: {
          content_category: 'post',
        },
      },
    })
  })

  it('rejects unstructured update data', () => {
    expect(() => RequestChannelPublishUpdateSchema.parse({
      taskId: 'task-1',
      platform: AccountType.Facebook,
      accountId: 'account-1',
      data: {
        arbitrary: 'value',
      },
    })).toThrow()
  })
})
