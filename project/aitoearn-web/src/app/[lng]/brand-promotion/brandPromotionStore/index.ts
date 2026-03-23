/**
 * 品牌推广模块 Store
 * 管理推广计划列表、弹窗状态
 */

import type {
  IBrandPromotionStoreState,
  PromotionPlan,
} from './types'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import {
  apiCreateMaterialGroup,
  apiDeleteMaterialGroup,
  apiGetMaterialGroupList,
  apiUpdateMaterialGroupInfo,
} from '@/api/material'
import { usePlanTabStore } from '../planTabStore'

// 初始状态
const initialState: IBrandPromotionStoreState = {
  // 推广计划列表状态
  plans: [],
  plansLoading: false,
  plansPagination: {
    current: 1,
    pageSize: 9,
    total: 0,
    hasMore: true,
  },

  // 弹窗状态
  createPlanModalOpen: false,
  editingPlan: null,
  qrCodeDialogOpen: false,
  qrCodePlan: null,

  // 加载状态
  isSubmitting: false,
}

function getInitialState() {
  return lodash.cloneDeep(initialState)
}

export const useBrandPromotionStore = create(
  combine(getInitialState(), (set, get) => {
    const methods = {
      // ==================== 推广计划方法 ====================

      /**
       * 获取推广计划列表
       */
      fetchPlans: async (page: number = 1) => {
        set({ plansLoading: true })
        try {
          const { plansPagination } = get()
          const res = await apiGetMaterialGroupList(page, plansPagination.pageSize)
          const list = (res?.data?.list || []) as PromotionPlan[]
          const total = res?.data?.total || 0

          set({
            plans: list,
            plansPagination: {
              ...plansPagination,
              current: page,
              total,
              hasMore: list.length === plansPagination.pageSize,
            },
          })
        }
        catch {
          // 错误由调用方处理
        }
        finally {
          set({ plansLoading: false })
        }
      },

      /**
       * 创建推广计划
       */
      createPlan: async (data: {
        name: string
      }): Promise<boolean> => {
        set({ isSubmitting: true })
        try {
          const res = await apiCreateMaterialGroup(data)
          if (!res)
            return false
          await methods.fetchPlans(1)
          // 通知 planTabStore 同步
          const resData = res?.data as Record<string, unknown> | undefined
          const newPlanId = resData?.id as string | undefined
          usePlanTabStore.getState().onPlanCreated(newPlanId)
          return true
        }
        catch {
          return false
        }
        finally {
          set({ isSubmitting: false })
        }
      },

      /**
       * 更新推广计划
       */
      updatePlan: async (
        id: string,
        data: { name?: string },
      ): Promise<boolean> => {
        set({ isSubmitting: true })
        try {
          const res = await apiUpdateMaterialGroupInfo(id, data)
          if (!res)
            return false
          const { plansPagination } = get()
          await methods.fetchPlans(plansPagination.current)
          // 通知 planTabStore 同步
          usePlanTabStore.getState().onPlanUpdated(id, data)
          return true
        }
        catch {
          return false
        }
        finally {
          set({ isSubmitting: false })
        }
      },

      /**
       * 删除推广计划
       */
      deletePlan: async (id: string): Promise<boolean> => {
        set({ isSubmitting: true })
        try {
          await apiDeleteMaterialGroup(id)
          const { plansPagination } = get()
          await methods.fetchPlans(plansPagination.current)
          // 通知 planTabStore 同步
          usePlanTabStore.getState().onPlanDeleted(id)
          return true
        }
        catch {
          return false
        }
        finally {
          set({ isSubmitting: false })
        }
      },

      // ==================== 弹窗控制 ====================

      openCreatePlanModal: () => {
        set({ createPlanModalOpen: true, editingPlan: null })
      },

      openEditPlanModal: (plan: PromotionPlan) => {
        set({ createPlanModalOpen: true, editingPlan: plan })
      },

      closePlanModal: () => {
        set({ createPlanModalOpen: false, editingPlan: null })
      },

      openQRCodeDialog: (plan: PromotionPlan) => {
        set({ qrCodeDialogOpen: true, qrCodePlan: plan })
      },

      closeQRCodeDialog: () => {
        set({ qrCodeDialogOpen: false, qrCodePlan: null })
      },

      // ==================== 重置 ====================

      reset: () => {
        set(getInitialState())
      },
    }

    return methods
  }),
)
