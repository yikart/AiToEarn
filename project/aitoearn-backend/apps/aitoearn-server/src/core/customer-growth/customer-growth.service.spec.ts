import { describe, expect, it, vi } from 'vitest'
import { CustomerGrowthService } from './customer-growth.service'

function createService() {
  const globalKnowledgeRepository = {
    listByUserId: vi.fn().mockResolvedValue([]),
  }
  const customerRadarWorkspaceRepository = {
    listAllWorkspaces: vi.fn().mockResolvedValue([]),
  }
  const systemSettingRepository = {
    getByKey: vi.fn().mockResolvedValue(null),
  }
  const userRepository = {
    list: vi.fn().mockResolvedValue([]),
  }

  const service = new CustomerGrowthService(
    globalKnowledgeRepository as never,
    customerRadarWorkspaceRepository as never,
    systemSettingRepository as never,
    userRepository as never,
  )

  return {
    service,
    systemSettingRepository,
  }
}

describe('CustomerGrowthService', () => {
  it('generates a safe local fallback reply when no AI provider key is configured', async () => {
    const { service, systemSettingRepository } = createService()

    const result = await service.generateReplyCandidate('user-1', {
      candidate: {
        author: '新店主',
        commentContent: '刚开业的小店适合怎么做小红书获客？',
        sourceTitle: '门店获客问题',
        sourceType: 'owned_post_comments',
      },
      customer: {
        city: '杭州',
        memory: ['关注同城流量'],
        name: '新店主',
        tags: ['门店'],
      },
      knowledgeRefs: [],
      profile: {
        industry: '本地生活',
        keywords: ['开业引流'],
        painPoints: ['没人咨询'],
        region: '杭州',
      },
    })

    expect(systemSettingRepository.getByKey).toHaveBeenCalled()
    expect(result).toMatchObject({
      model: 'local-fallback',
      source: 'fallback',
    })
    expect(result.replyContent).toContain('账号和评论区诊断')
    expect(result.replyContent.length).toBeLessThanOrEqual(160)
  })
})
