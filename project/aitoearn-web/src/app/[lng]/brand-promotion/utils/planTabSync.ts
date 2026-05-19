/**
 * 品牌推广计划 Tab 跨页面同步工具
 * 用于创建草稿箱后通知品牌推广页刷新计划列表
 */

const PLAN_TAB_SYNC_STORAGE_KEY = 'aito:brand-promotion:plan-tab-sync'

export const PLAN_TAB_SYNC_EVENT = 'aito:brand-promotion:plan-tab-sync'

export interface PlanTabSyncDetail {
  planId?: string
  timestamp: number
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export function emitPlanTabRefresh(planId?: string) {
  if (!isBrowser()) {
    return
  }

  const detail: PlanTabSyncDetail = {
    planId,
    timestamp: Date.now(),
  }

  sessionStorage.setItem(PLAN_TAB_SYNC_STORAGE_KEY, JSON.stringify(detail))
  window.dispatchEvent(new CustomEvent<PlanTabSyncDetail>(PLAN_TAB_SYNC_EVENT, { detail }))
}

export function consumePlanTabRefresh() {
  if (!isBrowser()) {
    return null
  }

  const raw = sessionStorage.getItem(PLAN_TAB_SYNC_STORAGE_KEY)
  if (!raw) {
    return null
  }

  sessionStorage.removeItem(PLAN_TAB_SYNC_STORAGE_KEY)

  try {
    const detail = JSON.parse(raw) as Partial<PlanTabSyncDetail>

    if (typeof detail.timestamp !== 'number') {
      return null
    }

    return {
      planId: typeof detail.planId === 'string' ? detail.planId : undefined,
      timestamp: detail.timestamp,
    } satisfies PlanTabSyncDetail
  }
  catch {
    return null
  }
}
