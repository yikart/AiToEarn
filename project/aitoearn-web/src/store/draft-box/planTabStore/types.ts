/**
 * 草稿箱 Tab 栏 Store 类型定义
 * 管理 Tab 列表、选中状态、更多面板数据
 */

import type { MaterialPagination, PromotionPlan } from '@/api/materials/material.types'

export interface IPlanTabStoreState {
  /** Tab 栏显示的计划列表 */
  tabPlans: PromotionPlan[]
  tabPlansLoading: boolean
  /** 当前选中计划 ID（持久化） */
  selectedPlanId: string | null
  /** 「更多」面板的完整列表 */
  morePlans: PromotionPlan[]
  morePlansLoading: boolean
  morePlansPagination: MaterialPagination
  /** 更多面板是否展开 */
  morePanelOpen: boolean
  /** 是否已初始化 */
  initialized: boolean
}
