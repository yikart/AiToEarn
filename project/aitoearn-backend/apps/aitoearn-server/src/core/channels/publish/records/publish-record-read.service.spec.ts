import { AccountType, ResponseCode, WorkStatus } from '@yikart/common'
import { PublishRecordLinkStatus, PublishStatus, PublishType } from '@yikart/mongodb'
import { describe, expect, it, vi } from 'vitest'
import { RelayAuthException } from '../../relay/relay-auth.exception'
import { PublishRecordReadService } from './publish-record-read.service'

vi.mock('@yikart/mongodb', () => ({
  AccountRepository: class AccountRepository {},
  PublishRecordRepository: class PublishRecordRepository {},
  PublishRecordSource: {
    Web: 'web',
  },
  PublishRecordLinkStatus: {
    PENDING: 'pending',
    READY: 'ready',
    FAILED: 'failed',
  },
  PublishStatus: {
    Failed: -1,
    WaitingForPublish: 0,
    Published: 1,
    Publishing: 2,
    WaitingForUpdate: 3,
    Updating: 4,
    UpdatedFailed: 5,
    Queued: 6,
    PlatformScheduled: 7,
    WaitingForUserAction: 8,
    Canceled: 9,
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

function createService(input: {
  publishRecordRepo: Record<string, unknown>
  accountRepository?: Record<string, unknown>
  workService?: Record<string, unknown>
  relayClientService?: Record<string, unknown>
}) {
  return new PublishRecordReadService(
    input.publishRecordRepo as never,
    (input.accountRepository ?? {}) as never,
    (input.workService ?? {}) as never,
    input.relayClientService as never,
  )
}

describe('publish record read service', () => {
  it('merges local and relay records before applying pagination', async () => {
    const localRecords = [
      { id: 'local-2', createdAt: new Date('2026-01-02T00:00:00.000Z') },
      { id: 'local-1', createdAt: new Date('2026-01-01T00:00:00.000Z') },
      { id: 'local-3', createdAt: new Date('2025-12-31T00:00:00.000Z') },
    ]
    const publishRecordRepo = {
      listByFilterPaginated: vi.fn(async () => ({ records: localRecords, total: 3 })),
    }
    const accountRepository = {
      listRelayAccountsByUserId: vi.fn(async () => [{
        id: 'local-account',
        relayAccountRef: 'remote-account',
        type: AccountType.Douyin,
      }]),
    }
    const relayClientService = {
      enabled: true,
      get: vi.fn(async () => ({
        records: [
          { id: 'relay-1', createdAt: new Date('2026-01-03T00:00:00.000Z') },
          { id: 'relay-2', createdAt: new Date('2025-12-30T00:00:00.000Z') },
        ],
        total: 2,
      })),
    }
    const service = createService({ publishRecordRepo, accountRepository, relayClientService })

    await expect(service.listByUserIdPaginated('user-1', {
      pageNo: 2,
      pageSize: 2,
      accountType: AccountType.Douyin,
    })).resolves.toEqual({
      records: [expect.objectContaining({ id: 'local-1' }), expect.objectContaining({ id: 'local-3' })],
      total: 5,
      pageNo: 2,
      pageSize: 2,
    })

    expect(publishRecordRepo.listByFilterPaginated).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      pageNo: 2,
      pageSize: 2,
      limit: 4,
    }))
    expect(relayClientService.get).toHaveBeenCalledWith('/v2/channels/publish/records', expect.objectContaining({
      pageNo: 1,
      pageSize: 4,
      accountId: 'remote-account',
    }))
  })

  it('fetches enough relay pages before applying the merged offset', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      id: `relay-${index}`,
      createdAt: new Date(Date.UTC(2026, 0, 3) - index * 1_000),
    }))
    const secondPage = Array.from({ length: 50 }, (_, index) => ({
      id: `relay-${index + 100}`,
      createdAt: new Date(Date.UTC(2026, 0, 2) - index * 1_000),
    }))
    const publishRecordRepo = {
      listByFilterPaginated: vi.fn(async () => ({ records: [], total: 0 })),
    }
    const accountRepository = {
      listRelayAccountsByUserId: vi.fn(async () => [{ id: 'local-account', relayAccountRef: 'remote-account', type: AccountType.Douyin }]),
    }
    const relayClientService = {
      enabled: true,
      get: vi.fn(async (_path: string, query: { pageNo: number }) => ({
        records: query.pageNo === 1 ? firstPage : secondPage,
        total: 150,
      })),
    }
    const service = createService({ publishRecordRepo, accountRepository, relayClientService })

    const result = await service.listByUserIdPaginated('user-1', {
      pageNo: 2,
      pageSize: 100,
      accountType: AccountType.Douyin,
    })

    expect(result).toMatchObject({ total: 150, pageNo: 2, pageSize: 100 })
    expect(result.records).toHaveLength(50)
    expect(result.records[0]).toMatchObject({ id: 'relay-100', accountId: 'local-account' })
    expect(relayClientService.get).toHaveBeenNthCalledWith(2, '/v2/channels/publish/records', expect.objectContaining({
      pageNo: 2,
      pageSize: 100,
      accountId: 'remote-account',
    }))
  })

  it('returns no relay records when relay support is disabled', async () => {
    const publishRecordRepo = {
      listByFilterPaginated: vi.fn(async () => ({
        records: [{ id: 'local-1', createdAt: new Date('2026-01-01T00:00:00.000Z') }],
        total: 1,
      })),
    }
    const service = createService({ publishRecordRepo, relayClientService: { enabled: false } })

    await expect(service.listByUserIdPaginated('user-1', {
      pageNo: 1,
      pageSize: 20,
    })).resolves.toMatchObject({ records: [{ id: 'local-1' }], total: 1 })
  })

  it('returns local public detail without fetching relay records', async () => {
    const localRecord = {
      id: 'record-1',
      status: PublishStatus.Published,
    }
    const publishRecordRepo = {
      getById: vi.fn(async () => localRecord),
    }
    const relayClientService = {
      enabled: true,
      get: vi.fn(),
    }
    const service = createService({ publishRecordRepo, relayClientService })

    await expect(service.getPublicDetail('record-1')).resolves.toBe(localRecord)

    expect(publishRecordRepo.getById).toHaveBeenCalledWith('record-1')
    expect(relayClientService.get).not.toHaveBeenCalled()
  })

  it('throws relay auth exception for public detail when local record is missing and relay is enabled', async () => {
    const publishRecordRepo = {
      getById: vi.fn(async () => null),
    }
    const relayClientService = {
      enabled: true,
      get: vi.fn(),
    }
    const service = createService({ publishRecordRepo, relayClientService })

    await expect(service.getPublicDetail('relay-record-1'))
      .rejects
      .toBeInstanceOf(RelayAuthException)

    expect(relayClientService.get).not.toHaveBeenCalled()
  })

  it('throws publish record not found for public detail when local record is missing and relay is disabled', async () => {
    const publishRecordRepo = {
      getById: vi.fn(async () => null),
    }
    const relayClientService = {
      enabled: false,
      get: vi.fn(),
    }
    const service = createService({ publishRecordRepo, relayClientService })

    await expect(service.getPublicDetail('relay-record-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.PublishRecordNotFound })

    expect(relayClientService.get).not.toHaveBeenCalled()
  })

  it('rejects relay detail records without account ownership mapping data', async () => {
    const publishRecordRepo = {
      getByIdAndUserId: vi.fn(async () => null),
    }
    const accountRepository = {
      listRelayAccountsByUserId: vi.fn(),
    }
    const relayClientService = {
      enabled: true,
      get: vi.fn(async () => ({
        id: 'relay-record-1',
      })),
    }
    const service = createService({ publishRecordRepo, accountRepository, relayClientService })

    await expect(service.getDetail('relay-record-1', 'user-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.PublishRecordNotFound })

    expect(accountRepository.listRelayAccountsByUserId).not.toHaveBeenCalled()
  })

  it('deletes owned terminal local records', async () => {
    const publishRecordRepo = {
      getByIdAndUserId: vi.fn(async () => ({
        id: 'record-1',
        userId: 'user-1',
        status: PublishStatus.Published,
      })),
      deleteByIdAndUserId: vi.fn(async () => true),
    }
    const service = createService({ publishRecordRepo })

    await expect(service.deleteById('user-1', 'record-1')).resolves.toBeUndefined()

    expect(publishRecordRepo.getByIdAndUserId).toHaveBeenCalledWith('record-1', 'user-1')
    expect(publishRecordRepo.deleteByIdAndUserId).toHaveBeenCalledWith('record-1', 'user-1')
  })

  it('does not delete relay or inaccessible records', async () => {
    const publishRecordRepo = {
      getByIdAndUserId: vi.fn(async () => null),
      deleteByIdAndUserId: vi.fn(),
    }
    const relayClientService = {
      enabled: true,
      get: vi.fn(),
    }
    const service = createService({ publishRecordRepo, relayClientService })

    await expect(service.deleteById('user-1', 'record-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.PublishRecordNotFound })

    expect(relayClientService.get).not.toHaveBeenCalled()
    expect(publishRecordRepo.deleteByIdAndUserId).not.toHaveBeenCalled()
  })

  it('rejects non-terminal records without deleting them', async () => {
    const publishRecordRepo = {
      getByIdAndUserId: vi.fn(async () => ({
        id: 'record-1',
        userId: 'user-1',
        status: PublishStatus.Queued,
      })),
      deleteByIdAndUserId: vi.fn(),
    }
    const service = createService({ publishRecordRepo })

    await expect(service.deleteById('user-1', 'record-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.PublishTaskStatusInvalid })

    expect(publishRecordRepo.deleteByIdAndUserId).not.toHaveBeenCalled()
  })

  it('returns Douyin user action for owned waiting records', async () => {
    const publishRecordRepo = {
      getByIdAndUserId: vi.fn(async () => ({
        id: 'record-1',
        userId: 'user-1',
        accountType: 'douyin',
        status: PublishStatus.WaitingForUserAction,
        dataOption: {
          shareId: 'share_1',
          schema: 'snssdk1128://openplatform/share?state=share_1',
          shortLink: 'https://s.example.com/abc123',
          expiresAt: '2026-06-05T10:00:00.000Z',
          webhook: {
            event: 'create_video',
            client_key: 'client-key',
            content: {
              share_id: 'share_1',
              item_id: 'item_1',
            },
          },
        },
      })),
    }
    const service = createService({ publishRecordRepo })

    await expect(service.getUserAction('user-1', 'record-1')).resolves.toEqual({
      recordId: 'record-1',
      platform: 'douyin',
      shareId: 'share_1',
      schemeUrl: 'snssdk1128://openplatform/share?state=share_1',
      shortLink: 'https://s.example.com/abc123',
      expiresAt: new Date('2026-06-05T10:00:00.000Z'),
    })
  })

  it('rejects user action reads for records outside waiting state', async () => {
    const publishRecordRepo = {
      getByIdAndUserId: vi.fn(async () => ({
        id: 'record-1',
        userId: 'user-1',
        accountType: 'douyin',
        status: PublishStatus.Published,
        dataOption: { shareId: 'share_1' },
      })),
    }
    const service = createService({ publishRecordRepo })

    await expect(service.getUserAction('user-1', 'record-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.PublishTaskStatusInvalid })
  })

  it('updates pending work link status without requiring a work link', async () => {
    const publishRecordRepo = {
      getByIdAndUserId: vi.fn(async () => ({
        id: 'record-1',
        userId: 'user-1',
        accountType: AccountType.WeChatChannels,
        accountId: 'account-1',
      })),
      updateById: vi.fn(async (_id, update) => ({
        id: 'record-1',
        accountType: AccountType.WeChatChannels,
        ...update.$set,
      })),
    }
    const workService = {
      getLinkInfo: vi.fn(),
    }
    const service = createService({ publishRecordRepo, workService })

    await expect(service.updateWorkLink('user-1', 'record-1', {
      dataId: 'media_md5',
      linkStatus: PublishRecordLinkStatus.PENDING,
      linkMeta: { mediaMd5sum: 'media_md5', videoClipTaskId: 'clip_1' },
    } as never)).resolves.toMatchObject({
      linkStatus: PublishRecordLinkStatus.PENDING,
      dataId: 'media_md5',
      linkMeta: { mediaMd5sum: 'media_md5', videoClipTaskId: 'clip_1' },
    })

    expect(workService.getLinkInfo).not.toHaveBeenCalled()
    expect(publishRecordRepo.updateById).toHaveBeenCalledWith('record-1', {
      $set: {
        linkStatus: PublishRecordLinkStatus.PENDING,
        linkError: '',
        dataId: 'media_md5',
        linkMeta: { mediaMd5sum: 'media_md5', videoClipTaskId: 'clip_1' },
      },
    })
  })

  it('rejects ready work link updates without a work link', async () => {
    const publishRecordRepo = {
      getByIdAndUserId: vi.fn(async () => ({
        id: 'record-1',
        userId: 'user-1',
        accountType: AccountType.WeChatChannels,
        accountId: 'account-1',
      })),
      updateById: vi.fn(),
    }
    const service = createService({ publishRecordRepo })

    await expect(service.updateWorkLink('user-1', 'record-1', {
      linkStatus: PublishRecordLinkStatus.READY,
    } as never)).rejects.toMatchObject({ code: ResponseCode.InvalidWorkLink })

    expect(publishRecordRepo.updateById).not.toHaveBeenCalled()
  })

  it('resolves ready work links and stores derived link fields', async () => {
    const publishRecordRepo = {
      getByIdAndUserId: vi.fn(async () => ({
        id: 'record-1',
        userId: 'user-1',
        accountType: AccountType.WeChatChannels,
        accountId: 'account-1',
      })),
      updateById: vi.fn(async (_id, update) => ({
        id: 'record-1',
        accountType: AccountType.WeChatChannels,
        ...update.$set,
      })),
    }
    const workService = {
      getLinkInfo: vi.fn(async () => ({
        platform: AccountType.WeChatChannels,
        work: { id: 'feed_1', url: 'https://channels.weixin.qq.com/web/pages/feed?feedId=feed_1', mediaType: 'video' },
        snapshots: [],
        extra: {
          dataId: 'feed_1',
          uniqueId: `${AccountType.WeChatChannels}_feed_1`,
          originalWorkLink: 'https://short.example/feed',
          workStatus: WorkStatus.NORMAL,
        },
      })),
    }
    const service = createService({ publishRecordRepo, workService })

    await expect(service.updateWorkLink('user-1', 'record-1', {
      workLink: 'https://short.example/feed',
      platformWorkId: 'feed_1',
      linkStatus: PublishRecordLinkStatus.READY,
      linkMeta: { mediaMd5sum: 'media_md5' },
    } as never)).resolves.toMatchObject({
      workLink: 'https://channels.weixin.qq.com/web/pages/feed?feedId=feed_1',
      dataId: 'feed_1',
      uniqueId: `${AccountType.WeChatChannels}_feed_1`,
      linkStatus: PublishRecordLinkStatus.READY,
      linkMeta: { mediaMd5sum: 'media_md5' },
    })

    expect(workService.getLinkInfo).toHaveBeenCalledWith(
      'user-1',
      AccountType.WeChatChannels,
      'https://short.example/feed',
      'account-1',
      'feed_1',
    )
    expect(publishRecordRepo.updateById).toHaveBeenCalledWith('record-1', {
      $set: expect.objectContaining({
        workLink: 'https://channels.weixin.qq.com/web/pages/feed?feedId=feed_1',
        dataId: 'feed_1',
        uniqueId: `${AccountType.WeChatChannels}_feed_1`,
        platformWorkId: 'feed_1',
        originalWorkLink: 'https://short.example/feed',
        workStatus: WorkStatus.NORMAL,
        linkStatus: PublishRecordLinkStatus.READY,
        linkError: '',
        linkMeta: { mediaMd5sum: 'media_md5' },
        type: PublishType.VIDEO,
      }),
    })
  })
})
