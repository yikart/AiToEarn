/**
 * 草稿箱计划列表 Store 类型定义
 * 数据模型统一来自 API 类型层，避免页面 store 反向承载公共类型。
 */

import type { MaterialPagination, PromotionPlan } from '@/api/materials/material.types'

export type { MaterialPagination, PromotionPlan } from '@/api/materials/material.types'

export interface IBrandPromotionStoreState {
  plans: PromotionPlan[]
  plansLoading: boolean
  plansPagination: MaterialPagination
  createPlanModalOpen: boolean
  editingPlan: PromotionPlan | null
  isSubmitting: boolean
}

export interface IBrandPromotionStoreMethods {
  fetchPlans: (page?: number) => Promise<void>
  createPlan: (data: { name: string }) => Promise<boolean>
  updatePlan: (id: string, data: { name?: string }) => Promise<boolean>
  deletePlan: (id: string) => Promise<boolean>
  openCreatePlanModal: () => void
  openEditPlanModal: (plan: PromotionPlan) => void
  closePlanModal: () => void
  reset: () => void
}

export type IBrandPromotionStore = IBrandPromotionStoreState & IBrandPromotionStoreMethods
