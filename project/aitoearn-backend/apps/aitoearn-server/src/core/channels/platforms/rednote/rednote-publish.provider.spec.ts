import { AccountType, AppException, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { PublishValidationIssueCode } from '../publish.schema'
import { RedNotePublishProvider } from './rednote-publish.provider'
import { RedNoteWorkProvider } from './rednote-work.provider'

vi.mock('@yikart/mongodb', () => ({
  PublishType: {
    VIDEO: 'video',
  },
}))

function createProvider() {
  return new RedNotePublishProvider(new RedNoteWorkProvider())
}

describe('rednote publish provider', () => {
  it('validates completed work links from supported RedNote URL shapes', async () => {
    const provider = createProvider()

    await expect(provider.validate({
      platform: AccountType.RedNote,
      accountId: 'account_1',
      content: { media: [] },
      option: { workLink: 'https://www.xiaohongshu.com/explore/note_1' },
    })).resolves.toMatchObject({ valid: true })

    await expect(provider.validate({
      platform: AccountType.RedNote,
      accountId: 'account_1',
      content: { media: [] },
      option: { workLink: 'https://www.xiaohongshu.com/discovery/item/note_2' },
    })).resolves.toMatchObject({ valid: true })

    await expect(provider.validate({
      platform: AccountType.RedNote,
      accountId: 'account_1',
      content: { media: [] },
      option: { workLink: 'https://www.xiaohongshu.com/red_video/note_3' },
    })).resolves.toMatchObject({ valid: true })

    await expect(provider.validate({
      platform: AccountType.RedNote,
      accountId: 'account_1',
      content: { media: [] },
      option: { workLink: 'https://www.xiaohongshu.com/user/profile/user_1/note_4' },
    })).resolves.toMatchObject({ valid: true })
  })

  it('rejects missing or unsupported work links', async () => {
    const provider = createProvider()

    await expect(provider.validate({
      platform: AccountType.RedNote,
      accountId: 'account_1',
      content: { media: [] },
      option: undefined,
    })).resolves.toMatchObject({
      valid: false,
      issues: [expect.objectContaining({ code: PublishValidationIssueCode.Required })],
    })

    await expect(provider.validate({
      platform: AccountType.RedNote,
      accountId: 'account_1',
      content: { media: [] },
      option: { workLink: 'https://example.com/explore/note_1' },
    })).resolves.toMatchObject({
      valid: false,
      issues: [expect.objectContaining({ code: PublishValidationIssueCode.InvalidOption })],
    })
  })

  it('returns completed publish result derived from workLink', async () => {
    const provider = createProvider()

    await expect(provider.publish({
      taskId: 'task_1',
      platform: AccountType.RedNote,
      accountId: 'account_1',
      content: { media: [] },
      option: { workLink: 'https://www.xiaohongshu.com/explore/note_1?xsec_token=token' },
      credential: { accessToken: '', platformUid: 'rednote_uid' },
    })).resolves.toMatchObject({
      status: 200,
      platformWorkId: 'note_1',
      permalink: 'https://www.xiaohongshu.com/explore/note_1?xsec_token=token',
      dataOption: {
        dataId: 'note_1',
        uniqueId: `${AccountType.RedNote}_note_1`,
      },
    })
  })

  it('returns completed publish result derived from a red video workLink', async () => {
    const provider = createProvider()
    const workLink = 'https://www.xiaohongshu.com/red_video/6a097ceb0000000006034dd2?xsec_token=ABQEfDMN45Zdiuid6riXVMCYnnxRQ1sorIzAmInO0FE9I=&xsec_source=pc_dual_feed'

    await expect(provider.publish({
      taskId: 'task_1',
      platform: AccountType.RedNote,
      accountId: 'account_1',
      content: { media: [] },
      option: { workLink },
      credential: { accessToken: '', platformUid: 'rednote_uid' },
    })).resolves.toMatchObject({
      status: 200,
      platformWorkId: '6a097ceb0000000006034dd2',
      permalink: workLink,
      dataOption: {
        dataId: '6a097ceb0000000006034dd2',
        uniqueId: `${AccountType.RedNote}_6a097ceb0000000006034dd2`,
      },
    })
  })

  it('throws InvalidWorkLink when publish receives an unsupported link', async () => {
    const provider = createProvider()

    await expect(provider.publish({
      taskId: 'task_1',
      platform: AccountType.RedNote,
      accountId: 'account_1',
      content: { media: [] },
      option: { workLink: 'https://example.com/explore/note_1' },
      credential: { accessToken: '' },
    })).rejects.toMatchObject<AppException>({
      code: ResponseCode.InvalidWorkLink,
    })
  })
})
