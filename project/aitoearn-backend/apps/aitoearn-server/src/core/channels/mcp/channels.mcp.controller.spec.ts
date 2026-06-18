import { AccountType } from '@yikart/common'
import { PublishStatus, PublishType } from '@yikart/mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ChannelEngagementActionType, ChannelEngagementFunctionName, ChannelEngagementTargetType, ChannelPaginationMode } from '../platforms/platforms.interface'
import { ChannelsMcpController } from './channels.mcp.controller'

const commonMocks = vi.hoisted(() => ({
  getUser: vi.fn(() => ({ id: 'user-1' })),
  toYamlTextResult: vi.fn((value: unknown) => value),
}))

vi.mock('@yikart/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@yikart/common')>()
  return {
    ...actual,
    getUser: commonMocks.getUser,
    toYamlTextResult: commonMocks.toYamlTextResult,
  }
})

vi.mock('@yikart/nest-mcp', () => ({
  Tool: () => () => undefined,
}))

vi.mock('@yikart/mongodb', () => ({
  PublishRecordSource: {
    Mcp: 'mcp',
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
    PlatformScheduled: 7,
    WaitingForUserAction: 8,
    Canceled: 9,
  },
  PublishType: {
    VIDEO: 'video',
    ARTICLE: 'article',
  },
}))

vi.mock('./channels.mcp.service', () => ({
  ChannelsMcpService: class ChannelsMcpService {},
}))

describe('channelsMcpController', () => {
  beforeEach(() => {
    commonMocks.getUser.mockClear()
    commonMocks.toYamlTextResult.mockClear()
  })

  it('serializes a missing taskId publish record as null', async () => {
    const service = {
      getChannelPublishRecordByTaskId: vi.fn(async () => null),
    }
    const controller = new ChannelsMcpController(service as never)

    await controller.getChannelPublishRecordByTaskId({ taskId: 'task-1' })

    expect(service.getChannelPublishRecordByTaskId).toHaveBeenCalledWith('user-1', { taskId: 'task-1' })
    expect(commonMocks.toYamlTextResult).toHaveBeenCalledWith(null)
  })

  it('filters work detail output through the work VO before YAML serialization', async () => {
    const fetchedAt = new Date('2026-01-01T00:00:00.000Z')
    const controller = new ChannelsMcpController({
      getChannelWorkDetail: vi.fn(async () => ({
        platform: AccountType.YouTube,
        work: {
          id: 'video-1',
          url: 'https://youtube.com/watch?v=video-1',
        },
        snapshots: [{
          platformWorkId: 'video-1',
          snapshotAt: fetchedAt,
          fetchedAt,
          work: { id: 'video-1' },
          rawResponse: { token: 'snapshot-raw-token' },
        }],
        rawResponse: { token: 'raw-token' },
        token: 'access-token',
      })),
    } as never)

    await controller.getChannelWorkDetail({
      platform: AccountType.YouTube,
      platformWorkId: 'video-1',
      accountId: 'account-1',
    })

    expect(commonMocks.toYamlTextResult).toHaveBeenCalledWith({
      platform: AccountType.YouTube,
      work: {
        id: 'video-1',
        url: 'https://youtube.com/watch?v=video-1',
      },
      snapshots: [{
        platformWorkId: 'video-1',
        snapshotAt: fetchedAt,
        fetchedAt,
        work: { id: 'video-1' },
      }],
    })
  })

  it('filters account analytics output through the analytics VO before YAML serialization', async () => {
    const fetchedAt = new Date('2026-01-01T00:00:00.000Z')
    const controller = new ChannelsMcpController({
      getChannelAccountAnalytics: vi.fn(async () => ({
        platform: AccountType.TikTok,
        accountId: 'account-1',
        snapshots: [{
          platformUid: 'uid-1',
          snapshotAt: fetchedAt,
          fetchedAt,
          metrics: { fansCount: 12 },
          rawResponse: { token: 'snapshot-raw-token' },
        }],
        raw: { token: 'raw-token' },
        errorData: { token: 'error-token' },
      })),
    } as never)

    await controller.getChannelAccountAnalytics({
      accountId: 'account-1',
    })

    expect(commonMocks.toYamlTextResult).toHaveBeenCalledWith({
      platform: AccountType.TikTok,
      accountId: 'account-1',
      snapshots: [{
        platformUid: 'uid-1',
        snapshotAt: fetchedAt,
        fetchedAt,
        metrics: { fansCount: 12 },
      }],
    })
  })

  it('filters comments output through the comment list VO before YAML serialization', async () => {
    const controller = new ChannelsMcpController({
      listChannelEngagementComments: vi.fn(async () => ({
        platform: AccountType.Facebook,
        items: [{
          platformCommentId: 'comment-1',
          content: 'hello',
          rawResponse: { token: 'raw-token' },
        }],
        pagination: { mode: ChannelPaginationMode.None },
        token: 'access-token',
      })),
    } as never)

    await controller.listChannelEngagementComments({
      platform: AccountType.Facebook,
      platformWorkId: 'post-1',
      accountId: 'account-1',
      pagination: {},
    })

    expect(commonMocks.toYamlTextResult).toHaveBeenCalledWith({
      platform: AccountType.Facebook,
      items: [{
        platformCommentId: 'comment-1',
        content: 'hello',
      }],
      pagination: { mode: ChannelPaginationMode.None },
    })
  })

  it('filters publish record list output through the publish record VO before YAML serialization', async () => {
    const publishTime = new Date('2026-01-01T00:00:00.000Z')
    const controller = new ChannelsMcpController({
      listChannelPublishRecords: vi.fn(async () => [{
        id: 'record-1',
        taskId: 'task-1',
        accountType: AccountType.YouTube,
        type: PublishType.VIDEO,
        status: PublishStatus.Published,
        publishTime,
        errorData: {
          type: 'platform',
          code: '15070',
          message: 'YouTube platform API request failed',
          originalData: { raw: { token: 'error-token' } },
        },
        option: { privacyStatus: 'private' },
        dataOption: { token: 'data-token' },
        pendingUpdate: { title: 'draft' },
        pendingMediaJobs: [{ id: 'job-1' }],
      }]),
    } as never)

    await controller.listChannelPublishRecords({
      accountType: AccountType.YouTube,
    })

    expect(commonMocks.toYamlTextResult).toHaveBeenCalledWith([{
      id: 'record-1',
      taskId: 'task-1',
      accountType: AccountType.YouTube,
      type: PublishType.VIDEO,
      status: PublishStatus.Published,
      publishTime,
      errorData: {
        type: 'platform',
        code: '15070',
        message: 'YouTube platform API request failed',
      },
    }])
  })

  it('filters engagement action output through the action VO before YAML serialization', async () => {
    const controller = new ChannelsMcpController({
      callChannelEngagementFunction: vi.fn(async () => ({
        platform: AccountType.Twitter,
        actionType: ChannelEngagementActionType.Like,
        targetType: ChannelEngagementTargetType.Work,
        targetId: 'tweet-1',
        success: true,
        rawResponse: { token: 'raw-token' },
        accessToken: 'access-token',
      })),
    } as never)

    await controller.callChannelEngagementFunction({
      platform: AccountType.Twitter,
      accountId: 'account-1',
      name: ChannelEngagementFunctionName.Like,
      data: { platformWorkId: 'tweet-1' },
    })

    expect(commonMocks.toYamlTextResult).toHaveBeenCalledWith({
      platform: AccountType.Twitter,
      actionType: ChannelEngagementActionType.Like,
      targetType: ChannelEngagementTargetType.Work,
      targetId: 'tweet-1',
      success: true,
    })
  })
})
