import { describe, expect, it } from 'vitest'
import {
  NurtureStage,
  STAGE_CONFIGS,
  NurtureStateMachine,
  type NurtureContext,
  type AllowedAction,
} from './account-state'

// ─── 辅助函数 ────────────────────────────────────────────────

function createMockContext(
  daysAgo: number,
  currentStage?: NurtureStage,
  todayCounts?: NurtureContext['todayCounts'],
): NurtureContext {
  const registeredAt = new Date()
  registeredAt.setDate(registeredAt.getDate() - daysAgo)

  return {
    accountId: 'test-account',
    platform: 'douyin' as any,
    registeredAt,
    currentStage: currentStage ?? NurtureStateMachine.inferStage(registeredAt),
    todayCounts: todayCounts ?? { publish: 0, engagement: 0, comments: 0 },
  }
}

// ─── 阶段推断测试 ────────────────────────────────────────────

describe('NurtureStateMachine.inferStage', () => {
  it('COLD 阶段：注册 0-3 天', () => {
    expect(NurtureStateMachine.inferStage(new Date(Date.now() - 0 * 86400000))).toBe(NurtureStage.COLD)
    expect(NurtureStateMachine.inferStage(new Date(Date.now() - 1 * 86400000))).toBe(NurtureStage.COLD)
    expect(NurtureStateMachine.inferStage(new Date(Date.now() - 3 * 86400000))).toBe(NurtureStage.COLD)
  })

  it('WARM 阶段：注册 4-7 天', () => {
    expect(NurtureStateMachine.inferStage(new Date(Date.now() - 4 * 86400000))).toBe(NurtureStage.WARM)
    expect(NurtureStateMachine.inferStage(new Date(Date.now() - 7 * 86400000))).toBe(NurtureStage.WARM)
  })

  it('HOT 阶段：注册 8-14 天', () => {
    expect(NurtureStateMachine.inferStage(new Date(Date.now() - 8 * 86400000))).toBe(NurtureStage.HOT)
    expect(NurtureStateMachine.inferStage(new Date(Date.now() - 14 * 86400000))).toBe(NurtureStage.HOT)
  })

  it('ACTIVE 阶段：注册 15 天以上', () => {
    expect(NurtureStateMachine.inferStage(new Date(Date.now() - 15 * 86400000))).toBe(NurtureStage.ACTIVE)
    expect(NurtureStateMachine.inferStage(new Date(Date.now() - 30 * 86400000))).toBe(NurtureStage.ACTIVE)
    expect(NurtureStateMachine.inferStage(new Date(Date.now() - 365 * 86400000))).toBe(NurtureStage.ACTIVE)
  })
})

// ─── 配置表测试 ──────────────────────────────────────────────

describe('STAGE_CONFIGS', () => {
  it('COLD 阶段禁止发布', () => {
    const config = STAGE_CONFIGS[NurtureStage.COLD]
    expect(config.maxDailyPublish).toBe(0)
    expect(config.allowedActions).not.toContain('publish')
  })

  it('WARM 阶段允许每日 1 条发布', () => {
    const config = STAGE_CONFIGS[NurtureStage.WARM]
    expect(config.maxDailyPublish).toBe(1)
    expect(config.allowedActions).toContain('publish')
  })

  it('HOT 阶段允许私信', () => {
    const config = STAGE_CONFIGS[NurtureStage.HOT]
    expect(config.allowedActions).toContain('dm')
  })

  it('ACTIVE 阶段拥有全部动作权限', () => {
    const config = STAGE_CONFIGS[NurtureStage.ACTIVE]
    expect(config.allowedActions).toContain('share')
    expect(config.maxDailyPublish).toBe(5)
  })

  it('所有阶段都允许浏览', () => {
    for (const stage of Object.values(NurtureStage)) {
      expect(STAGE_CONFIGS[stage].allowedActions).toContain('browse')
    }
  })
})

// ─── 动作检查测试 ────────────────────────────────────────────

describe('NurtureStateMachine.checkAction', () => {
  it('COLD 阶段禁止发布', () => {
    const ctx = createMockContext(2)
    const result = NurtureStateMachine.checkAction(ctx, 'publish')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('不允许')
  })

  it('COLD 阶段允许浏览', () => {
    const ctx = createMockContext(2)
    const result = NurtureStateMachine.checkAction(ctx, 'browse')
    expect(result.allowed).toBe(true)
  })

  it('COLD 阶段允许点赞', () => {
    const ctx = createMockContext(2)
    const result = NurtureStateMachine.checkAction(ctx, 'like')
    expect(result.allowed).toBe(true)
  })

  it('WARM 阶段允许发布（配额内）', () => {
    const ctx = createMockContext(5)
    const result = NurtureStateMachine.checkAction(ctx, 'publish')
    expect(result.allowed).toBe(true)
  })

  it('WARM 阶段发布配额用完后禁止', () => {
    const ctx = createMockContext(5, undefined, { publish: 1, engagement: 0, comments: 0 })
    const result = NurtureStateMachine.checkAction(ctx, 'publish')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('配额已用完')
  })

  it('评论配额用完后禁止评论', () => {
    const ctx = createMockContext(5, undefined, { publish: 0, engagement: 0, comments: 5 })
    const result = NurtureStateMachine.checkAction(ctx, 'comment')
    expect(result.allowed).toBe(false)
  })

  it('未知动作被拒绝', () => {
    const ctx = createMockContext(2)
    const result = NurtureStateMachine.checkAction(ctx, 'share' as AllowedAction)
    expect(result.allowed).toBe(false)
  })
})

// ─── 配额消耗测试 ────────────────────────────────────────────

describe('NurtureStateMachine.consume', () => {
  it('发布动作只增加 publish 计数', () => {
    const ctx = createMockContext(5)
    NurtureStateMachine.consume(ctx, 'publish')
    expect(ctx.todayCounts.publish).toBe(1)
    expect(ctx.todayCounts.engagement).toBe(0)
  })

  it('评论动作同时增加 comments 和 engagement 计数', () => {
    const ctx = createMockContext(5)
    NurtureStateMachine.consume(ctx, 'comment')
    expect(ctx.todayCounts.comments).toBe(1)
    expect(ctx.todayCounts.engagement).toBe(1)
  })

  it('点赞动作只增加 engagement 计数', () => {
    const ctx = createMockContext(5)
    NurtureStateMachine.consume(ctx, 'like')
    expect(ctx.todayCounts.engagement).toBe(1)
    expect(ctx.todayCounts.publish).toBe(0)
    expect(ctx.todayCounts.comments).toBe(0)
  })
})

// ─── 状态转移测试 ────────────────────────────────────────────

describe('NurtureStateMachine.tryTransition', () => {
  it('COLD → WARM：注册满 4 天且当前处于 COLD', () => {
    // 注册 4 天时 inferStage 已经是 WARM，所以手动设置为 COLD 来测试转移
    const registeredAt = new Date()
    registeredAt.setDate(registeredAt.getDate() - 4)
    const ctx: NurtureContext = {
      accountId: 'test',
      platform: 'douyin' as any,
      registeredAt,
      currentStage: NurtureStage.COLD, // 手动设为 COLD 模拟未更新的场景
      todayCounts: { publish: 0, engagement: 0, comments: 0 },
    }
    const result = NurtureStateMachine.tryTransition(ctx)
    expect(result.transitioned).toBe(true)
    expect(result.newStage).toBe(NurtureStage.WARM)
    expect(ctx.currentStage).toBe(NurtureStage.WARM)
  })

  it('WARM → HOT：注册满 8 天且当前处于 WARM', () => {
    const registeredAt = new Date()
    registeredAt.setDate(registeredAt.getDate() - 8)
    const ctx: NurtureContext = {
      accountId: 'test',
      platform: 'douyin' as any,
      registeredAt,
      currentStage: NurtureStage.WARM,
      todayCounts: { publish: 0, engagement: 0, comments: 0 },
    }
    const result = NurtureStateMachine.tryTransition(ctx)
    expect(result.transitioned).toBe(true)
    expect(result.newStage).toBe(NurtureStage.HOT)
  })

  it('HOT → ACTIVE：注册满 15 天且当前处于 HOT', () => {
    const registeredAt = new Date()
    registeredAt.setDate(registeredAt.getDate() - 15)
    const ctx: NurtureContext = {
      accountId: 'test',
      platform: 'douyin' as any,
      registeredAt,
      currentStage: NurtureStage.HOT,
      todayCounts: { publish: 0, engagement: 0, comments: 0 },
    }
    const result = NurtureStateMachine.tryTransition(ctx)
    expect(result.transitioned).toBe(true)
    expect(result.newStage).toBe(NurtureStage.ACTIVE)
  })

  it('已在 ACTIVE 不会重复转移', () => {
    const ctx = createMockContext(30)
    const result = NurtureStateMachine.tryTransition(ctx)
    expect(result.transitioned).toBe(false)
    expect(result.newStage).toBe(NurtureStage.ACTIVE)
  })

  it('转移后记录 lastTransitionAt', () => {
    const registeredAt = new Date()
    registeredAt.setDate(registeredAt.getDate() - 4)
    const ctx: NurtureContext = {
      accountId: 'test',
      platform: 'douyin' as any,
      registeredAt,
      currentStage: NurtureStage.COLD,
      todayCounts: { publish: 0, engagement: 0, comments: 0 },
    }
    NurtureStateMachine.tryTransition(ctx)
    expect(ctx.lastTransitionAt).toBeDefined()
    expect(ctx.lastTransitionAt).toBeInstanceOf(Date)
  })

  it('未到转移天数时不转移', () => {
    const ctx = createMockContext(2) // 注册 2 天，仍在 COLD
    const result = NurtureStateMachine.tryTransition(ctx)
    expect(result.transitioned).toBe(false)
    expect(result.newStage).toBe(NurtureStage.COLD)
  })
})

// ─── 每日重置测试 ────────────────────────────────────────────

describe('NurtureStateMachine.resetDailyCounts', () => {
  it('将所有计数重置为 0', () => {
    const ctx = createMockContext(5)
    ctx.todayCounts = { publish: 1, engagement: 3, comments: 2 }
    NurtureStateMachine.resetDailyCounts(ctx)
    expect(ctx.todayCounts).toEqual({ publish: 0, engagement: 0, comments: 0 })
  })
})

// ─── 剩余配额测试 ────────────────────────────────────────────

describe('ActionResult.remainingQuota', () => {
  it('COLD 阶段评论配额剩余正确', () => {
    const ctx = createMockContext(2)
    const result = NurtureStateMachine.checkAction(ctx, 'comment')
    expect(result.allowed).toBe(true)
    expect(result.remainingQuota.comments).toBe(5)
  })

  it('WARM 阶段发布配额扣减正确', () => {
    const ctx = createMockContext(5, undefined, { publish: 1, engagement: 0, comments: 0 })
    const result = NurtureStateMachine.checkAction(ctx, 'publish')
    expect(result.allowed).toBe(false)
    expect(result.remainingQuota.publish).toBe(0)
  })
})
