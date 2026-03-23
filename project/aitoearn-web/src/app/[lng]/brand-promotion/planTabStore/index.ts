/**
 * 推广计划 Tab 栏 Store
 * 管理 Tab 列表切换、选中计划持久化、更多面板分页加载
 */

import type { PromotionPlan } from '../brandPromotionStore/types'
import type { IPlanTabStoreState } from './types'
import { apiGetMaterialGroupList } from '@/api/material'
import { createPersistStore } from '@/utils/createPersistStore'

const PAGE_SIZE = 50

const initialState: IPlanTabStoreState = {
  tabPlans: [],
  tabPlansLoading: false,
  selectedPlanId: null,
  morePlans: [],
  morePlansLoading: false,
  morePlansPagination: {
    current: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    hasMore: true,
  },
  morePanelOpen: false,
  initialized: false,
}

export const usePlanTabStore = createPersistStore(
  initialState,
  (set, get) => {
    const methods = {
      /**
       * 初始化 Tab 列表
       * 加载第一页推广计划，恢复或默认选中
       */
      initTabs: async () => {
        const { initialized } = get()
        if (initialized)
          return

        set({ tabPlansLoading: true })
        try {
          const res = await apiGetMaterialGroupList(1, PAGE_SIZE)
          const list = res?.data?.list || []
          const total = res?.data?.total || 0

          const { selectedPlanId } = get()
          // 恢复持久化选中，若不在列表中则选第一个
          let validSelectedId: string | null = null
          if (selectedPlanId && list.some(p => p.id === selectedPlanId)) {
            validSelectedId = selectedPlanId
          }
          else if (list.length > 0) {
            validSelectedId = list[0].id
          }

          set({
            tabPlans: list,
            selectedPlanId: validSelectedId,
            initialized: true,
            morePlansPagination: {
              current: 1,
              pageSize: PAGE_SIZE,
              total,
              hasMore: list.length < total,
            },
          })
        }
        catch {
          set({ initialized: true })
        }
        finally {
          set({ tabPlansLoading: false })
        }
      },

      /**
       * 切换选中计划
       */
      selectPlan: (planId: string) => {
        set({ selectedPlanId: planId, morePanelOpen: false })
      },

      /**
       * 加载「更多」面板数据（指定页）
       */
      fetchMorePlans: async (page: number = 1) => {
        set({ morePlansLoading: true })
        try {
          const res = await apiGetMaterialGroupList(page, PAGE_SIZE)
          const list = res?.data?.list || []
          const total = res?.data?.total || 0

          if (page === 1) {
            set({ morePlans: list })
          }
          else {
            const { morePlans } = get()
            set({ morePlans: [...morePlans, ...list] })
          }

          set({
            morePlansPagination: {
              current: page,
              pageSize: PAGE_SIZE,
              total,
              hasMore: page * PAGE_SIZE < total,
            },
          })
        }
        catch {
          // 静默失败
        }
        finally {
          set({ morePlansLoading: false })
        }
      },

      /**
       * 面板内加载下一页
       */
      loadMoreInPanel: async () => {
        const { morePlansLoading, morePlansPagination } = get()
        if (morePlansLoading || !morePlansPagination.hasMore)
          return
        await methods.fetchMorePlans(morePlansPagination.current + 1)
      },

      /**
       * 创建计划后同步
       * 刷新 tabPlans + 自动选中新计划
       */
      onPlanCreated: async (newPlanId?: string) => {
        try {
          const res = await apiGetMaterialGroupList(1, PAGE_SIZE)
          const list = (res?.data?.list || []) as PromotionPlan[]
          const total = res?.data?.total || 0

          set({
            tabPlans: list,
            morePlansPagination: {
              current: 1,
              pageSize: PAGE_SIZE,
              total,
              hasMore: list.length < total,
            },
          })

          // 自动选中新计划
          if (newPlanId && list.some(p => p.id === newPlanId)) {
            set({ selectedPlanId: newPlanId })
          }
          else if (list.length > 0) {
            set({ selectedPlanId: list[0].id })
          }
        }
        catch {
          // 静默失败
        }
      },

      /**
       * 删除计划后同步
       * 从列表移除 + 自动切换到第一个
       */
      onPlanDeleted: (deletedPlanId: string) => {
        const { tabPlans, selectedPlanId, morePlans } = get()
        const newTabPlans = tabPlans.filter(p => p.id !== deletedPlanId)
        const newMorePlans = morePlans.filter(p => p.id !== deletedPlanId)

        const updates: Partial<IPlanTabStoreState> = {
          tabPlans: newTabPlans,
          morePlans: newMorePlans,
        }

        // 如果删除的是当前选中计划，切换到第一个
        if (selectedPlanId === deletedPlanId) {
          updates.selectedPlanId = newTabPlans.length > 0 ? newTabPlans[0].id : null
        }

        set(updates as IPlanTabStoreState)
      },

      /**
       * 更新计划后同步
       * 就地更新 tabPlans/morePlans 中的名称
       */
      onPlanUpdated: (planId: string, data: { name?: string, desc?: string }) => {
        const { tabPlans, morePlans } = get()

        const updateList = (list: PromotionPlan[]) =>
          list.map(p => (p.id === planId ? { ...p, ...data } : p))

        set({
          tabPlans: updateList(tabPlans),
          morePlans: updateList(morePlans),
        } as Partial<IPlanTabStoreState> as IPlanTabStoreState)
      },

      /**
       * 打开更多面板
       */
      openMorePanel: () => {
        set({ morePanelOpen: true })
        // 打开时加载第一页
        methods.fetchMorePlans(1)
      },

      /**
       * 关闭更多面板
       */
      closeMorePanel: () => {
        set({ morePanelOpen: false })
      },

      /**
       * 重置 Store
       */
      reset: () => {
        set({
          ...initialState,
          selectedPlanId: null,
        } as IPlanTabStoreState)
      },
    }

    return methods
  },
  {
    name: 'plan-tab-store',
    partialize: (state) => {
      return { selectedPlanId: state.selectedPlanId } as typeof state
    },
  },
)
