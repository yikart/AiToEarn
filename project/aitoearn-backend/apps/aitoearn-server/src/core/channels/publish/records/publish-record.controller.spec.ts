import { AccountType } from '@yikart/common'
import { PublishRecordLinkStatus, PublishRecordSource, PublishStatus, PublishType } from '@yikart/mongodb'
import { describe, expect, it, vi } from 'vitest'
import { PublishRecordController } from './publish-record.controller'

vi.mock('@yikart/aitoearn-auth', () => ({
  GetToken: () => () => undefined,
  Public: () => () => undefined,
  TokenInfo: class TokenInfo {},
}))

vi.mock('@yikart/mongodb', () => ({
  PublishRecordRepository: class PublishRecordRepository {},
  AccountRepository: class AccountRepository {},
  PublishRecordLinkStatus: {
    PENDING: 'pending',
    READY: 'ready',
  },
  PublishRecordSource: {
    Web: 'web',
  },
  PublishStatus: {
    Published: 1,
  },
  PublishType: {
    VIDEO: 'video',
  },
}))

vi.mock('../../relay/relay-client.service', () => ({
  RelayClientService: class RelayClientService {},
}))

vi.mock('../../works/work.service', () => ({
  WorkService: class WorkService {},
}))

describe('publish record controller', () => {
  it('returns only publish record VO fields from list responses', async () => {
    const recordReadService = {
      listByUserId: vi.fn(async () => [{
        id: 'record-1',
        accountId: 'account-1',
        accountType: AccountType.Douyin,
        type: PublishType.VIDEO,
        status: PublishStatus.Published,
        publishTime: new Date('2026-05-22T10:00:00.000Z'),
        source: PublishRecordSource.Web,
        linkStatus: PublishRecordLinkStatus.PENDING,
        linkError: 'waiting for link',
        linkMeta: { mediaMd5sum: 'media_md5' },
        option: { privateToken: 'debug-option' },
        errorData: {
          type: 'platform',
          code: 'invalid_request',
          message: 'Invalid request',
          originalData: { raw: { token: 'debug-error' } },
        },
        pendingUpdate: { raw: 'debug-update' },
      }]),
    }
    const controller = new PublishRecordController(recordReadService as never)

    const result = await controller.listRecords({ id: 'user-1' } as never, {} as never)

    expect(result).toEqual([expect.objectContaining({
      id: 'record-1',
      accountType: AccountType.Douyin,
      type: PublishType.VIDEO,
      status: PublishStatus.Published,
      linkStatus: PublishRecordLinkStatus.PENDING,
      linkError: 'waiting for link',
      linkMeta: { mediaMd5sum: 'media_md5' },
    })])
    expect(result[0]).not.toHaveProperty('option')
    expect(result[0]).toMatchObject({
      errorData: { type: 'platform', code: 'invalid_request', message: 'Invalid request' },
      linkStatus: PublishRecordLinkStatus.PENDING,
      linkError: 'waiting for link',
      linkMeta: { mediaMd5sum: 'media_md5' },
    })
    expect(result[0].errorData).not.toHaveProperty('originalData')
    expect(result[0]).not.toHaveProperty('pendingUpdate')
  })

  it('returns only public publish record VO fields from public detail responses', async () => {
    const recordReadService = {
      getPublicDetail: vi.fn(async () => ({
        id: 'record-1',
        userId: 'user-1',
        flowId: 'flow-1',
        taskId: 'task-1',
        accountId: 'account-1',
        accountType: AccountType.Douyin,
        type: PublishType.VIDEO,
        status: PublishStatus.Published,
        title: 'private title',
        desc: 'private desc',
        publishTime: new Date('2026-05-22T10:00:00.000Z'),
        platformWorkId: 'work-1',
        workLink: 'https://example.com/work-1',
        videoUrl: 'https://example.com/private-video.mp4',
        coverUrl: 'https://example.com/private-cover.jpg',
        imgUrlList: ['https://example.com/private-image.jpg'],
        source: PublishRecordSource.Web,
        linkStatus: PublishRecordLinkStatus.READY,
        linkError: 'private link error',
        linkMeta: { mediaMd5sum: 'media_md5' },
        errorMsg: 'private error',
        errorData: { type: 'platform', code: 'invalid_request', message: 'Invalid request' },
        option: { privateToken: 'debug-option' },
        dataOption: { raw: 'debug-data' },
        createdAt: new Date('2026-05-22T09:59:00.000Z'),
        updatedAt: new Date('2026-05-22T10:01:00.000Z'),
      })),
    }
    const controller = new PublishRecordController(recordReadService as never)

    const result = await controller.getPublicRecord('record-1')

    expect(result).toEqual({
      id: 'record-1',
      accountType: AccountType.Douyin,
      type: PublishType.VIDEO,
      status: PublishStatus.Published,
      publishTime: new Date('2026-05-22T10:00:00.000Z'),
      platformWorkId: 'work-1',
      workLink: 'https://example.com/work-1',
      linkStatus: PublishRecordLinkStatus.READY,
      createdAt: new Date('2026-05-22T09:59:00.000Z'),
      updatedAt: new Date('2026-05-22T10:01:00.000Z'),
    })
    expect(recordReadService.getPublicDetail).toHaveBeenCalledWith('record-1')
    expect(result).not.toHaveProperty('userId')
    expect(result).not.toHaveProperty('flowId')
    expect(result).not.toHaveProperty('taskId')
    expect(result).not.toHaveProperty('accountId')
    expect(result).not.toHaveProperty('title')
    expect(result).not.toHaveProperty('desc')
    expect(result).not.toHaveProperty('videoUrl')
    expect(result).not.toHaveProperty('coverUrl')
    expect(result).not.toHaveProperty('imgUrlList')
    expect(result).not.toHaveProperty('source')
    expect(result).not.toHaveProperty('errorMsg')
    expect(result).not.toHaveProperty('errorData')
    expect(result).not.toHaveProperty('linkError')
    expect(result).not.toHaveProperty('linkMeta')
    expect(result).not.toHaveProperty('option')
    expect(result).not.toHaveProperty('dataOption')
  })

  it('updates work link status for the current user and returns record VO fields', async () => {
    const recordReadService = {
      updateWorkLink: vi.fn(async () => ({
        id: 'record-1',
        accountId: 'account-1',
        accountType: AccountType.WeChatChannels,
        type: PublishType.VIDEO,
        status: PublishStatus.Published,
        publishTime: new Date('2026-05-22T10:00:00.000Z'),
        platformWorkId: 'media_md5',
        linkStatus: PublishRecordLinkStatus.PENDING,
        linkMeta: { mediaMd5sum: 'media_md5' },
        option: { privateToken: 'debug-option' },
      })),
    }
    const controller = new PublishRecordController(recordReadService as never)

    const result = await controller.updateWorkLink(
      { id: 'user-1' } as never,
      'record-1',
      {
        linkStatus: PublishRecordLinkStatus.PENDING,
        linkMeta: { mediaMd5sum: 'media_md5' },
      } as never,
    )

    expect(recordReadService.updateWorkLink).toHaveBeenCalledWith('user-1', 'record-1', {
      linkStatus: PublishRecordLinkStatus.PENDING,
      linkMeta: { mediaMd5sum: 'media_md5' },
    })
    expect(result).toMatchObject({
      id: 'record-1',
      accountType: AccountType.WeChatChannels,
      linkStatus: PublishRecordLinkStatus.PENDING,
      linkMeta: { mediaMd5sum: 'media_md5' },
    })
    expect(result).not.toHaveProperty('option')
  })

  it('deletes publish records for the current user', async () => {
    const recordReadService = {
      deleteById: vi.fn(async () => undefined),
    }
    const controller = new PublishRecordController(recordReadService as never)

    await expect(controller.deleteRecord({ id: 'user-1' } as never, 'record-1')).resolves.toBeUndefined()

    expect(recordReadService.deleteById).toHaveBeenCalledWith('user-1', 'record-1')
  })

  it('returns user action for the current user', async () => {
    const recordReadService = {
      getUserAction: vi.fn(async () => ({
        recordId: 'record-1',
        platform: AccountType.Douyin,
        shareId: 'share_1',
        schemeUrl: 'snssdk1128://openplatform/share?state=share_1',
        shortLink: 'https://s.example.com/abc123',
      })),
    }
    const controller = new PublishRecordController(recordReadService as never)

    await expect(controller.getUserAction({ id: 'user-1' } as never, 'record-1')).resolves.toMatchObject({
      recordId: 'record-1',
      shareId: 'share_1',
      shortLink: 'https://s.example.com/abc123',
    })

    expect(recordReadService.getUserAction).toHaveBeenCalledWith('user-1', 'record-1')
  })
})
