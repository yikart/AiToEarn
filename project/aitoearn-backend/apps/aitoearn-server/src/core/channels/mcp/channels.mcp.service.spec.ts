import { AccountType } from '@yikart/common'
import { PublishRecordSource } from '@yikart/mongodb'
import { describe, expect, it, vi } from 'vitest'
import { ChannelsMcpService } from './channels.mcp.service'

vi.mock('@yikart/mongodb', () => ({
  PublishRecordSource: {
    Mcp: 'mcp',
  },
}))

vi.mock('../analytics/analytics.service', () => ({ AnalyticsService: class AnalyticsService {} }))
vi.mock('../engagement/engagement.service', () => ({ EngagementService: class EngagementService {} }))
vi.mock('../platforms/platforms.service', () => ({ PlatformsService: class PlatformsService {} }))
vi.mock('../platforms/platforms.registry', () => ({ PlatformIntegrationRegistry: class PlatformIntegrationRegistry {} }))
vi.mock('../publish/flows/publish-flow.service', () => ({ PublishFlowService: class PublishFlowService {} }))
vi.mock('../publish/records/publish-record-read.service', () => ({ PublishRecordReadService: class PublishRecordReadService {} }))
vi.mock('../publish/tasks/publish-task.service', () => ({ PublishTaskService: class PublishTaskService {} }))
vi.mock('../works/work.service', () => ({ WorkService: class WorkService {} }))

function createService(overrides: {
  publishFlowService?: Record<string, unknown>
  publishTaskService?: Record<string, unknown>
  recordReadService?: Record<string, unknown>
  analyticsService?: Record<string, unknown>
  engagementService?: Record<string, unknown>
  workService?: Record<string, unknown>
  registry?: Record<string, unknown>
  platformsService?: Record<string, unknown>
} = {}) {
  return new ChannelsMcpService(
    (overrides.publishFlowService ?? {}) as never,
    (overrides.publishTaskService ?? {}) as never,
    (overrides.recordReadService ?? {}) as never,
    (overrides.analyticsService ?? {}) as never,
    (overrides.engagementService ?? {}) as never,
    (overrides.workService ?? {}) as never,
    (overrides.registry ?? {}) as never,
    (overrides.platformsService ?? {}) as never,
  )
}

describe('channelsMcpService', () => {
  it('marks publish flows as MCP source', async () => {
    const publishFlowService = {
      createFlow: vi.fn().mockResolvedValue({ flowId: 'flow_1', tasks: [] }),
    }
    const service = createService({ publishFlowService })

    await service.createChannelPublishFlow('user_1', {
      content: {
        title: 'title',
        body: 'body',
        media: [],
        topics: [],
      },
      publishAt: new Date('2026-05-25T00:00:00.000Z'),
      context: {
        materialId: 'material_1',
      },
      items: [{
        platform: AccountType.Twitter,
        accountId: 'account_1',
      }],
    })

    expect(publishFlowService.createFlow).toHaveBeenCalledWith('user_1', expect.objectContaining({
      context: expect.objectContaining({
        materialId: 'material_1',
        source: PublishRecordSource.Mcp,
      }),
    }))
  })

  it('reads publish records by flowId without a union lookup payload', async () => {
    const recordReadService = {
      getByFlowId: vi.fn().mockResolvedValue({ id: 'record_1' }),
      getDetail: vi.fn(),
    }
    const service = createService({ recordReadService })

    await expect(service.getChannelPublishRecordByFlowId('user_1', {
      flowId: 'flow_1',
    })).resolves.toEqual({ id: 'record_1' })

    expect(recordReadService.getByFlowId).toHaveBeenCalledWith('user_1', 'flow_1')
    expect(recordReadService.getDetail).not.toHaveBeenCalled()
  })

  it('reads publish records by recordId without a union lookup payload', async () => {
    const recordReadService = {
      getDetail: vi.fn().mockResolvedValue({ id: 'record_1' }),
    }
    const service = createService({ recordReadService })

    await expect(service.getChannelPublishRecordByRecordId('user_1', {
      recordId: 'record_1',
    })).resolves.toEqual({ id: 'record_1' })

    expect(recordReadService.getDetail).toHaveBeenCalledWith('record_1', 'user_1')
  })

  it('reads publish records by taskId without using record detail lookup', async () => {
    const recordReadService = {
      getByTaskId: vi.fn().mockResolvedValue({ id: 'record_1', taskId: 'task_1' }),
      getDetail: vi.fn(),
    }
    const service = createService({ recordReadService })

    await expect(service.getChannelPublishRecordByTaskId('user_1', {
      taskId: 'task_1',
    })).resolves.toEqual({ id: 'record_1', taskId: 'task_1' })

    expect(recordReadService.getByTaskId).toHaveBeenCalledWith('user_1', 'task_1')
    expect(recordReadService.getDetail).not.toHaveBeenCalled()
  })

  it('keeps taskId publish record misses as nullable MCP results', async () => {
    const recordReadService = {
      getByTaskId: vi.fn().mockResolvedValue(null),
    }
    const service = createService({ recordReadService })

    await expect(service.getChannelPublishRecordByTaskId('user_1', {
      taskId: 'task_1',
    })).resolves.toBeNull()

    expect(recordReadService.getByTaskId).toHaveBeenCalledWith('user_1', 'task_1')
  })

  it('uses account-scoped option sources for YouTube categories', async () => {
    const publishOptions = {
      getAccountValues: vi.fn().mockResolvedValue({ field: 'categoryId', items: [] }),
    }
    const service = createService({ platformsService: publishOptions })

    await service.listYoutubeChannelPlatformCategories('user_1', {
      accountId: 'account_1',
      regionCode: 'US',
    })

    expect(publishOptions.getAccountValues).toHaveBeenCalledWith('user_1', 'account_1', 'categoryId', {
      id: undefined,
      regionCode: 'US',
    })
  })

  it('uses account-scoped option sources for Bilibili categories', async () => {
    const publishOptions = {
      getAccountValues: vi.fn().mockResolvedValue({ field: 'tid', items: [] }),
    }
    const service = createService({ platformsService: publishOptions })

    await service.listBilibiliChannelPlatformCategories('user_1', {
      accountId: 'account_1',
    })

    expect(publishOptions.getAccountValues).toHaveBeenCalledWith('user_1', 'account_1', 'tid')
  })
})
