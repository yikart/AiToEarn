import { AccountType } from '@yikart/common'

// ─── 枚举定义 ───────────────────────────────────────────────

export enum NurtureStage {
  /** 1-3天：只刷不发，建立基础活跃 */
  COLD = 'COLD',
  /** 4-7天：每日1-2次轻量互动（点赞/简单评论） */
  WARM = 'WARM',
  /** 8-14天：进入正常发布节奏 */
  HOT = 'HOT',
  /** 15天+：稳定运营期 */
  ACTIVE = 'ACTIVE',
}

// ─── 配置接口 ───────────────────────────────────────────────

export interface StageConfig {
  /** 阶段名称 */
  stage: NurtureStage
  /** 最低天数（距首次注册时间） */
  minDays: number
  /** 最高天数（含），超过则自动进入下一阶段 */
  maxDays: number
  /** 每日发布上限（0=禁止发布） */
  maxDailyPublish: number
  /** 每日互动上限（点赞+评论+关注等） */
  maxDailyEngagement: number
  /** 每日评论上限 */
  maxDailyComments: number
  /** 允许执行的动作集合 */
  allowedActions: AllowedAction[]
}

export type AllowedAction =
  | 'browse'          // 浏览内容
  | 'like'            // 点赞
  | 'comment'         // 评论
  | 'reply'           // 回复评论
  | 'bookmark'        // 收藏
  | 'follow'          // 关注
  | 'publish'         // 发布作品
  | 'dm'              // 发送私信
  | 'share'           // 分享

// ─── 动作结果 ───────────────────────────────────────────────

export interface ActionResult {
  /** 动作是否被允许 */
  allowed: boolean
  /** 如果禁止，原因说明 */
  reason?: string
  /** 当前阶段 */
  stage: NurtureStage
  /** 当日剩余配额 */
  remainingQuota: {
    publish: number
    engagement: number
    comments: number
  }
}

// ─── 状态上下文 ─────────────────────────────────────────────

export interface NurtureContext {
  /** 账户 ID */
  accountId: string
  /** 平台类型 */
  platform: AccountType
  /** 首次注册/激活日期 */
  registeredAt: Date
  /** 上次状态转移时间 */
  lastTransitionAt?: Date
  /** 当前所处阶段 */
  currentStage: NurtureStage
  /** 当日已执行动作计数 */
  todayCounts: {
    publish: number
    engagement: number
    comments: number
  }
}

// ─── 默认配置表 ─────────────────────────────────────────────

export const STAGE_CONFIGS: Record<NurtureStage, StageConfig> = {
  [NurtureStage.COLD]: {
    stage: NurtureStage.COLD,
    minDays: 1,
    maxDays: 3,
    maxDailyPublish: 0,        // 禁止发布
    maxDailyEngagement: 20,     // 可浏览+轻度互动
    maxDailyComments: 5,
    allowedActions: ['browse', 'like', 'comment', 'reply', 'bookmark', 'follow'],
  },
  [NurtureStage.WARM]: {
    stage: NurtureStage.WARM,
    minDays: 4,
    maxDays: 7,
    maxDailyPublish: 1,         // 每天最多1条
    maxDailyEngagement: 15,
    maxDailyComments: 5,
    allowedActions: ['browse', 'like', 'comment', 'reply', 'bookmark', 'follow', 'publish'],
  },
  [NurtureStage.HOT]: {
    stage: NurtureStage.HOT,
    minDays: 8,
    maxDays: 14,
    maxDailyPublish: 3,         // 逐步增加到3条
    maxDailyEngagement: 10,
    maxDailyComments: 3,
    allowedActions: ['browse', 'like', 'comment', 'reply', 'bookmark', 'follow', 'publish', 'dm'],
  },
  [NurtureStage.ACTIVE]: {
    stage: NurtureStage.ACTIVE,
    minDays: 15,
    maxDays: Infinity,
    maxDailyPublish: 5,         // 稳定期最高5条
    maxDailyEngagement: 10,
    maxDailyComments: 5,
    allowedActions: ['browse', 'like', 'comment', 'reply', 'bookmark', 'follow', 'publish', 'dm', 'share'],
  },
}

// ─── 核心服务类 ─────────────────────────────────────────────

export class NurtureStateMachine {
  /** 计算两个日期之间的天数差 */
  static daysSince(date: Date): number {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  /** 根据注册天数推断当前阶段 */
  static inferStage(registeredAt: Date): NurtureStage {
    const days = this.daysSince(registeredAt)
    if (days >= 15) return NurtureStage.ACTIVE
    if (days >= 8) return NurtureStage.HOT
    if (days >= 4) return NurtureStage.WARM
    return NurtureStage.COLD
  }

  /** 获取某个阶段的配置 */
  static getConfig(stage: NurtureStage): StageConfig {
    return STAGE_CONFIGS[stage]
  }

  /** 检查某动作在当前状态下是否允许 */
  static checkAction(
    context: NurtureContext,
    action: AllowedAction,
  ): ActionResult {
    const config = STAGE_CONFIGS[context.currentStage]

    // 1. 动作是否在允许列表中
    if (!config.allowedActions.includes(action)) {
      return {
        allowed: false,
        reason: `${context.currentStage}阶段不允许执行「${action}」动作`,
        stage: context.currentStage,
        remainingQuota: {
          publish: config.maxDailyPublish - context.todayCounts.publish,
          engagement: config.maxDailyEngagement - context.todayCounts.engagement,
          comments: config.maxDailyComments - context.todayCounts.comments,
        },
      }
    }

    // 2. 检查发布配额
    if (action === 'publish') {
      const remaining = config.maxDailyPublish - context.todayCounts.publish
      if (remaining <= 0) {
        return {
          allowed: false,
          reason: `今日发布配额已用完（${config.maxDailyPublish}/${config.maxDailyPublish}）`,
          stage: context.currentStage,
          remainingQuota: {
            publish: 0,
            engagement: config.maxDailyEngagement - context.todayCounts.engagement,
            comments: config.maxDailyComments - context.todayCounts.comments,
          },
        }
      }
    }

    // 3. 检查评论配额
    if (action === 'comment' || action === 'reply') {
      const remaining = config.maxDailyComments - context.todayCounts.comments
      if (remaining <= 0) {
        return {
          allowed: false,
          reason: `今日评论配额已用完（${config.maxDailyComments}/${config.maxDailyComments}）`,
          stage: context.currentStage,
          remainingQuota: {
            publish: config.maxDailyPublish - context.todayCounts.publish,
            engagement: config.maxDailyEngagement - context.todayCounts.engagement,
            comments: 0,
          },
        }
      }
    }

    // 4. 检查互动总配额
    if (action !== 'publish' && action !== 'comment' && action !== 'reply') {
      const remaining = config.maxDailyEngagement - context.todayCounts.engagement
      if (remaining <= 0) {
        return {
          allowed: false,
          reason: `今日互动配额已用完（${config.maxDailyEngagement}/${config.maxDailyEngagement}）`,
          stage: context.currentStage,
          remainingQuota: {
            publish: config.maxDailyPublish - context.todayCounts.publish,
            engagement: 0,
            comments: config.maxDailyComments - context.todayCounts.comments,
          },
        }
      }
    }

    // 通过所有检查
    return {
      allowed: true,
      stage: context.currentStage,
      remainingQuota: {
        publish: config.maxDailyPublish - context.todayCounts.publish,
        engagement: config.maxDailyEngagement - context.todayCounts.engagement,
        comments: config.maxDailyComments - context.todayCounts.comments,
      },
    }
  }

  /** 执行动作后扣减配额 */
  static consume(context: NurtureContext, action: AllowedAction): void {
    if (action === 'publish') {
      context.todayCounts.publish += 1
    } else if (action === 'comment' || action === 'reply') {
      context.todayCounts.comments += 1
      context.todayCounts.engagement += 1
    } else {
      context.todayCounts.engagement += 1
    }
  }

  /** 尝试转移阶段（每日调度时调用） */
  static tryTransition(context: NurtureContext): { transitioned: boolean; newStage: NurtureStage } {
    const days = this.daysSince(context.registeredAt)
    let newStage: NurtureStage

    if (days >= 15) newStage = NurtureStage.ACTIVE
    else if (days >= 8) newStage = NurtureStage.HOT
    else if (days >= 4) newStage = NurtureStage.WARM
    else newStage = NurtureStage.COLD

    if (newStage !== context.currentStage) {
      const prevStage = context.currentStage
      context.currentStage = newStage
      context.lastTransitionAt = new Date()
      return { transitioned: true, newStage }
    }

    return { transitioned: false, newStage: context.currentStage }
  }

  /** 重置当日计数（每日零点调用） */
  static resetDailyCounts(context: NurtureContext): void {
    context.todayCounts = {
      publish: 0,
      engagement: 0,
      comments: 0,
    }
  }
}
