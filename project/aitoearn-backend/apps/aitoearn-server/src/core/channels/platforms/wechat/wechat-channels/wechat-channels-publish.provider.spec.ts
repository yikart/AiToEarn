import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PublishValidationIssueCode } from '../../publish.schema'
import { WeChatChannelsPublishProvider } from './wechat-channels-publish.provider'

vi.mock('@yikart/mongodb', () => ({
  PublishRecordLinkStatus: {
    PENDING: 'pending',
    READY: 'ready',
    FAILED: 'failed',
  },
}))

function createProvider() {
  return new WeChatChannelsPublishProvider()
}

describe('wechat channels publish provider', () => {
  it('validates plugin completed work anchors', async () => {
    const provider = createProvider()

    await expect(provider.validate({
      platform: AccountType.WeChatChannels,
      accountId: 'account_1',
      content: { media: [] },
      option: { workId: 'media_md5' },
    })).resolves.toMatchObject({ valid: true })
  })

  it('rejects missing work anchors', async () => {
    const provider = createProvider()

    await expect(provider.validate({
      platform: AccountType.WeChatChannels,
      accountId: 'account_1',
      content: { media: [] },
      option: undefined,
    })).resolves.toMatchObject({
      valid: false,
      issues: [expect.objectContaining({ code: PublishValidationIssueCode.Required })],
    })
  })

  it('returns completed publish result with pending link metadata', async () => {
    const provider = createProvider()

    await expect(provider.publish({
      taskId: 'task_1',
      platform: AccountType.WeChatChannels,
      accountId: 'account_1',
      content: { media: [] },
      option: {
        workId: 'media_md5',
        linkStatus: 'pending',
        linkMeta: { mediaMd5sum: 'media_md5', videoClipTaskId: 'clip_1' },
      },
      credential: { accessToken: '', platformUid: 'finder_id' },
    })).resolves.toMatchObject({
      status: 200,
      platformWorkId: 'media_md5',
      linkStatus: 'pending',
      linkMeta: { mediaMd5sum: 'media_md5', videoClipTaskId: 'clip_1' },
      dataOption: {
        linkMeta: { mediaMd5sum: 'media_md5', videoClipTaskId: 'clip_1' },
      },
    })
  })

  it('throws when publish receives no work anchor', async () => {
    const provider = createProvider()

    await expect(provider.publish({
      taskId: 'task_1',
      platform: AccountType.WeChatChannels,
      accountId: 'account_1',
      content: { media: [] },
      option: {},
      credential: { accessToken: '' },
    })).rejects.toMatchObject<AppException>({
      code: ResponseCode.ChannelPublishPlatformWorkIdMissing,
    })
  })
})
