import { AccountType, ResponseCode } from '@yikart/common'
import { PublishRecordSource, PublishStatus, PublishType } from '@yikart/mongodb'
import { describe, expect, it, vi } from 'vitest'
import { DouyinOfflineQrService } from './douyin-offline-qr.service'

vi.mock('@yikart/mongodb', () => ({
  MaterialGroupRepository: class MaterialGroupRepository {},
  MaterialRepository: class MaterialRepository {},
  PublishRecordRepository: class PublishRecordRepository {},
  PublishRecordSource: {
    OfflineQr: 'offline_qr',
  },
  PublishStatus: {
    WaitingForUserAction: 8,
  },
  PublishType: {
    ARTICLE: 'article',
    VIDEO: 'video',
  },
}))

vi.mock('../douyin-publish.provider', () => ({
  DouyinPublishProvider: class DouyinPublishProvider {},
}))

vi.mock('../../../media/media.service', () => ({
  MediaService: class MediaService {},
}))

function createService() {
  const publishRecordRepo = {
    create: vi.fn(async data => ({ id: 'record_1', ...data })),
  }
  const materialGroupRepo = {
    getInfo: vi.fn(async () => ({ id: 'group_1' })),
  }
  const materialRepo = {
    getInfo: vi.fn(async () => ({ id: 'material_1', groupId: 'group_1' })),
  }
  const douyinPublishProvider = {
    createHandoffPublishResult: vi.fn(async () => ({
      platformWorkId: 'share_1',
      dataOption: {
        shareId: 'share_1',
        schema: 'snssdk1128://openplatform/share?state=share_1',
        shortLink: 'https://s.example.com/abc123',
        expiresAt: '2026-06-05T10:00:00.000Z',
      },
    })),
  }
  const mediaService = {
    preparePublishContentMedia: vi.fn(async ({ content }) => ({ content, issues: [] })),
  }

  return {
    service: new DouyinOfflineQrService(
      publishRecordRepo as never,
      materialGroupRepo as never,
      materialRepo as never,
      douyinPublishProvider as never,
      mediaService as never,
    ),
    publishRecordRepo,
    materialGroupRepo,
    materialRepo,
    douyinPublishProvider,
    mediaService,
  }
}

describe('douyin offline qr service', () => {
  it('creates an anonymous waiting record from current publish content shape', async () => {
    const { service, publishRecordRepo, douyinPublishProvider, mediaService } = createService()
    mediaService.preparePublishContentMedia.mockResolvedValueOnce({
      content: {
        title: '短标题',
        body: '正文 #咖啡 #治愈',
        media: [{ url: 'https://cdn.example.com/signed-video', metadata: { type: 'video' } }],
        cover: { url: 'https://cdn.example.com/cover.jpg', metadata: { type: 'image' } },
      },
      issues: [],
    })

    const result = await service.createPublish({
      materialGroupId: 'group_1',
      materialId: 'material_1',
      content: {
        title: '短标题',
        body: '正文 #咖啡 #治愈',
        media: [{ url: 'https://cdn.example.com/signed-video' }],
        cover: { url: 'https://cdn.example.com/cover.jpg' },
      },
      option: {
        short_title: '短标题',
      },
    })

    expect(douyinPublishProvider.createHandoffPublishResult).toHaveBeenCalledWith({
      content: expect.objectContaining({
        body: '正文 #咖啡 #治愈',
        media: [{ url: 'https://cdn.example.com/signed-video', metadata: { type: 'video' } }],
      }),
      option: { short_title: '短标题' },
    })
    expect(publishRecordRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: '',
      accountId: '',
      uid: '',
      accountType: AccountType.Douyin,
      materialGroupId: 'group_1',
      materialId: 'material_1',
      source: PublishRecordSource.OfflineQr,
      status: PublishStatus.WaitingForUserAction,
      type: PublishType.VIDEO,
      topics: ['咖啡', '治愈'],
      videoUrl: 'https://cdn.example.com/signed-video',
      imgUrlList: [],
      coverUrl: 'https://cdn.example.com/cover.jpg',
      platformWorkId: 'share_1',
      dataId: 'share_1',
      uniqueId: `${AccountType.Douyin}_share_1`,
    }))
    expect(result).toEqual({
      recordId: 'record_1',
      status: PublishStatus.WaitingForUserAction,
      userAction: {
        shareId: 'share_1',
        schemeUrl: 'snssdk1128://openplatform/share?state=share_1',
        shortLink: 'https://s.example.com/abc123',
        expiresAt: new Date('2026-06-05T10:00:00.000Z'),
      },
    })
  })

  it('rejects materials outside the requested material group', async () => {
    const { service, materialRepo } = createService()
    materialRepo.getInfo.mockResolvedValueOnce({ id: 'material_1', groupId: 'other_group' })

    await expect(service.createPublish({
      materialGroupId: 'group_1',
      materialId: 'material_1',
      content: {
        body: '正文',
        media: [{ url: 'https://cdn.example.com/video.mp4' }],
      },
    })).rejects.toMatchObject({ code: ResponseCode.MaterialNotFound })
  })
})
