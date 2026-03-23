/**
 * 品牌推广详情页 Store
 * 管理当前计划详情、素材列表
 */

import type {
  Pagination,
  PromotionMaterial,
  PromotionPlan,
} from './brandPromotionStore/types'
import type { ImageModelType, ImageTextDraftType, VideoDraftType } from '@/api/draftGeneration'
import type { MaterialFilterDeleteParams, MaterialListFilters } from '@/api/material'
import type { PlatType } from '@/app/config/platConfig'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import {
  apiCreateDraftGeneration,
  apiCreateImageTextDraft,
  apiGetDraftGenerationStats,
} from '@/api/draftGeneration'
import {
  apiBatchDeleteMaterials,
  apiDeleteMaterial,
  apiFilterDeleteMaterials,
  apiGetMaterialInfo,
  apiGetMaterialList,
} from '@/api/material'
import { usePublishDialogStorageStore } from '@/components/PublishDialog/usePublishDialogStorageStore'
import { toast } from '@/lib/toast'

// Store 状态类型
export interface IPlanDetailStoreState {
  // 已初始化的 planId，用于防止重复请求
  initializedPlanId: string | null

  // 当前计划
  currentPlan: PromotionPlan | null
  planLoading: boolean

  // 素材列表
  materials: PromotionMaterial[]
  materialsLoading: boolean
  materialsPagination: Pagination

  // 弹窗状态
  createMaterialModalOpen: boolean
  editingMaterial: PromotionMaterial | null

  // 草稿详情弹窗状态
  draftDetailDialogOpen: boolean
  selectedDraft: PromotionMaterial | null

  // 发布弹框状态
  publishDialogOpen: boolean
  publishingDraft: PromotionMaterial | null

  // 加载状态
  isSubmitting: boolean

  // AI 批量生成
  generatingCount: number
  aiBatchModalOpen: boolean
  generationDetailDialogOpen: boolean
  isGeneratingBatch: boolean

  // 搜索/筛选 & 批量操作
  materialsFilter: MaterialListFilters
  batchMode: boolean
  selectedMaterialIds: string[]
  batchDeleting: boolean
  conditionalDeleteDialogOpen: boolean
}

// 初始状态
const initialState: IPlanDetailStoreState = {
  initializedPlanId: null,

  currentPlan: null,
  planLoading: true,

  materials: [],
  materialsLoading: true,
  materialsPagination: {
    current: 1,
    pageSize: 12,
    total: 0,
    hasMore: true,
  },

  createMaterialModalOpen: false,
  editingMaterial: null,

  draftDetailDialogOpen: false,
  selectedDraft: null,

  publishDialogOpen: false,
  publishingDraft: null,

  isSubmitting: false,

  generatingCount: 0,
  aiBatchModalOpen: false,
  generationDetailDialogOpen: false,
  isGeneratingBatch: false,

  materialsFilter: {},
  batchMode: false,
  selectedMaterialIds: [],
  batchDeleting: false,
  conditionalDeleteDialogOpen: false,
}

function getInitialState() {
  return lodash.cloneDeep(initialState)
}

export const usePlanDetailStore = create(
  combine(getInitialState(), (set, get) => {
    const methods = {
      // ==================== 计划详情 ====================

      /**
       * 获取计划详情
       */
      fetchPlanDetail: async (planId: string) => {
        set({ planLoading: true })
        try {
          const res = await apiGetMaterialInfo(planId)
          const plan = res?.data as PromotionPlan
          set({ currentPlan: plan })
          return plan
        }
        catch {
          return null
        }
        finally {
          set({ planLoading: false })
        }
      },

      // ==================== 素材列表 ====================

      /**
       * 获取素材列表
       */
      fetchMaterials: async (planId: string, page: number = 1) => {
        set({ materialsLoading: true })
        try {
          const { materialsPagination, materialsFilter } = get()
          const res = await apiGetMaterialList(planId, page, materialsPagination.pageSize, materialsFilter)
          const resData = res?.data as { list?: any[], total?: number } | undefined
          const list = (resData?.list || []) as PromotionMaterial[]
          const total = resData?.total || 0

          set({
            materials: list,
            materialsPagination: {
              ...materialsPagination,
              current: page,
              total,
              hasMore: list.length === materialsPagination.pageSize,
            },
          })
        }
        catch {
          // 错误由调用方处理
        }
        finally {
          set({ materialsLoading: false })
        }
      },

      /**
       * 加载更多素材（无限滚动）
       */
      loadMoreMaterials: async (planId: string) => {
        const { materialsLoading, materialsPagination, materials, materialsFilter } = get()
        if (materialsLoading || !materialsPagination.hasMore)
          return

        set({ materialsLoading: true })
        try {
          const nextPage = materialsPagination.current + 1
          const res = await apiGetMaterialList(planId, nextPage, materialsPagination.pageSize, materialsFilter)
          const resData = res?.data as { list?: any[], total?: number } | undefined
          const list = (resData?.list || []) as PromotionMaterial[]
          const total = resData?.total || 0

          set({
            materials: [...materials, ...list],
            materialsPagination: {
              ...materialsPagination,
              current: nextPage,
              total,
              hasMore: list.length === materialsPagination.pageSize,
            },
          })
        }
        catch {
          // 错误由调用方处理
        }
        finally {
          set({ materialsLoading: false })
        }
      },

      /**
       * 删除素材
       */
      deleteMaterial: async (materialId: string): Promise<boolean> => {
        set({ isSubmitting: true })
        try {
          const res = await apiDeleteMaterial(materialId)
          if (res?.code !== 0)
            return false
          const { currentPlan, materialsPagination } = get()
          if (currentPlan) {
            await methods.fetchMaterials(currentPlan.id, materialsPagination.current)
          }
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

      openCreateMaterialModal: () => {
        set({ createMaterialModalOpen: true, editingMaterial: null })
      },

      openEditMaterialModal: (material: PromotionMaterial) => {
        set({ createMaterialModalOpen: true, editingMaterial: material })
      },

      closeMaterialModal: () => {
        set({ createMaterialModalOpen: false, editingMaterial: null })
      },

      // ==================== 草稿详情弹窗 ====================

      openDraftDetailDialog: (material: PromotionMaterial) => {
        set({ draftDetailDialogOpen: true, selectedDraft: material })
      },

      closeDraftDetailDialog: () => {
        set({ draftDetailDialogOpen: false, selectedDraft: null })
      },

      // ==================== 发布弹框 ====================

      openPublishDialog: (draft: PromotionMaterial) => {
        // 清空上次发布的缓存数据，避免 PublishDialog 触发「是否恢复」确认弹框
        usePublishDialogStorageStore.getState().clearPubData()
        set({ publishDialogOpen: true, publishingDraft: draft })
      },

      closePublishDialog: () => {
        set({ publishDialogOpen: false, publishingDraft: null })
      },

      // ==================== AI 批量生成 ====================

      openAiBatchModal: () => {
        set({ aiBatchModalOpen: true })
      },

      closeAiBatchModal: () => {
        set({ aiBatchModalOpen: false })
      },

      openGenerationDetailDialog: () => {
        set({ generationDetailDialogOpen: true })
      },

      closeGenerationDetailDialog: () => {
        set({ generationDetailDialogOpen: false })
      },

      /**
       * 创建 AI 批量生成任务
       */
      createBatchGeneration: async (
        quantity: number,
        modelType: string,
        duration?: number,
        aspectRatio?: string,
        prompt?: string,
        imageUrls?: string[],
        videoUrls?: string[],
        overrideGroupId?: string,
        platforms?: PlatType[],
        draftType?: VideoDraftType,
      ) => {
        const groupId = overrideGroupId || get().currentPlan?.id
        if (!groupId)
          return false

        set({ isGeneratingBatch: true })
        try {
          const res = await apiCreateDraftGeneration({
            quantity,
            groupId,
            model: modelType,
            duration,
            aspectRatio,
            prompt,
            imageUrls,
            videoUrls,
            platforms: platforms?.length ? platforms : undefined,
            draftType,
          })
          if (res?.code === 0) {
            const { generatingCount } = get()
            set({
              generatingCount: generatingCount + quantity,
            })
            return true
          }
          else {
            if (res?.message)
              toast.error(res.message)
            return false
          }
        }
        catch {
          return false
        }
        finally {
          set({ isGeneratingBatch: false })
        }
      },

      /**
       * 创建 AI 图文批量生成任务
       */
      createImageTextBatchGeneration: async (
        quantity: number,
        imageModel: ImageModelType,
        prompt: string,
        imageCount?: number,
        aspectRatio?: string,
        imageUrls?: string[],
        overrideGroupId?: string,
        imageSize?: string,
        platforms?: PlatType[],
        draftType?: ImageTextDraftType,
      ) => {
        const groupId = overrideGroupId || get().currentPlan?.id
        if (!groupId)
          return false

        set({ isGeneratingBatch: true })
        try {
          const res = await apiCreateImageTextDraft({
            quantity,
            groupId,
            prompt,
            imageModel,
            imageCount,
            imageUrls,
            aspectRatio,
            imageSize,
            platforms: platforms?.length ? platforms : undefined,
            draftType,
          })
          if (res?.code === 0) {
            const { generatingCount } = get()
            set({
              generatingCount: generatingCount + quantity,
            })
            return true
          }
          else {
            if (res?.message)
              toast.error(res.message)
            return false
          }
        }
        catch {
          return false
        }
        finally {
          set({ isGeneratingBatch: false })
        }
      },

      /**
       * 获取生成中任务数量（初始化时调用）
       */
      fetchGeneratingStats: async () => {
        try {
          const res = await apiGetDraftGenerationStats()
          if (res?.data) {
            set({ generatingCount: res.data.generatingCount || 0 })
          }
        }
        catch {
          // 静默失败
        }
      },

      /**
       * 轮询回调：更新生成中任务数量
       */
      updateGeneratingCount: (count: number) => {
        set({ generatingCount: count })
      },

      /**
       * 无感刷新素材列表（不触发 loading/骨架屏）
       * 静默请求第1页数据，找出新增的草稿 prepend 到头部
       */
      silentRefreshMaterials: async (planId: string) => {
        try {
          const { materialsPagination, materials, materialsFilter } = get()
          const res = await apiGetMaterialList(planId, 1, materialsPagination.pageSize, materialsFilter)
          const resData = res?.data as { list?: any[], total?: number } | undefined
          const freshList = (resData?.list || []) as PromotionMaterial[]
          const total = resData?.total || 0

          // 构建当前 materials 的 id Set
          const existingIds = new Set(materials.map(m => m.id))
          // 找出新增草稿
          const newItems = freshList.filter(item => !existingIds.has(item.id))

          if (newItems.length > 0) {
            set({
              materials: [...newItems, ...materials],
              materialsPagination: {
                ...materialsPagination,
                total,
              },
            })
          }
        }
        catch {
          // 静默失败
        }
      },

      // ==================== 搜索/筛选 & 批量操作 ====================

      setMaterialsFilter: (filter: MaterialListFilters) => {
        const { currentPlan } = get()
        set({
          materialsFilter: filter,
          materials: [],
          materialsPagination: {
            current: 1,
            pageSize: 12,
            total: 0,
            hasMore: true,
          },
        })
        if (currentPlan) {
          methods.fetchMaterials(currentPlan.id, 1)
        }
      },

      resetMaterialsFilter: () => {
        methods.setMaterialsFilter({})
      },

      enterBatchMode: () => {
        set({ batchMode: true, selectedMaterialIds: [] })
      },

      exitBatchMode: () => {
        set({ batchMode: false, selectedMaterialIds: [] })
      },

      toggleMaterialSelection: (id: string) => {
        const { selectedMaterialIds } = get()
        const index = selectedMaterialIds.indexOf(id)
        if (index === -1) {
          set({ selectedMaterialIds: [...selectedMaterialIds, id] })
        }
        else {
          set({ selectedMaterialIds: selectedMaterialIds.filter(i => i !== id) })
        }
      },

      selectAllLoadedMaterials: () => {
        const { materials } = get()
        set({ selectedMaterialIds: materials.map(m => m.id) })
      },

      deselectAllMaterials: () => {
        set({ selectedMaterialIds: [] })
      },

      batchDeleteMaterials: async () => {
        const { selectedMaterialIds, currentPlan } = get()
        if (selectedMaterialIds.length === 0 || !currentPlan)
          return false
        set({ batchDeleting: true })
        try {
          const res = await apiBatchDeleteMaterials(selectedMaterialIds)
          if (res?.code !== 0)
            return false
          set({ batchMode: false, selectedMaterialIds: [] })
          await methods.fetchMaterials(currentPlan.id, 1)
          return true
        }
        catch {
          return false
        }
        finally {
          set({ batchDeleting: false })
        }
      },

      openConditionalDeleteDialog: () => {
        set({ conditionalDeleteDialogOpen: true })
      },

      closeConditionalDeleteDialog: () => {
        set({ conditionalDeleteDialogOpen: false })
      },

      filterDeleteMaterials: async (conditions: Omit<MaterialFilterDeleteParams, 'groupId'>) => {
        const { currentPlan } = get()
        if (!currentPlan)
          return false
        try {
          const res = await apiFilterDeleteMaterials({ ...conditions, groupId: currentPlan.id })
          if (res?.code !== 0)
            return false
          set({ conditionalDeleteDialogOpen: false })
          await methods.fetchMaterials(currentPlan.id, 1)
          return true
        }
        catch {
          return false
        }
      },

      // ==================== 重置 ====================

      reset: () => {
        set(getInitialState())
      },

      /**
       * 初始化详情页数据
       * @param planId 计划 ID
       * @param force 是否强制重新加载（Tab 切换时使用）
       */
      initDetailPage: async (planId: string, force: boolean = false) => {
        // 如果已经初始化过相同的 planId 且非强制刷新，跳过
        const { initializedPlanId } = get()
        if (!force && initializedPlanId === planId) {
          return
        }

        // 重置状态
        set(getInitialState())
        // 标记正在初始化的 planId
        set({ initializedPlanId: planId })

        // 并行加载数据
        await Promise.all([
          methods.fetchPlanDetail(planId),
          methods.fetchMaterials(planId, 1),
          methods.fetchGeneratingStats(),
        ])
      },

      /**
       * 仅加载「内容管理」所需数据
       * 加载: planDetail + materials + generatingStats
       */
      initContentData: async (planId: string, force: boolean = false) => {
        const { initializedPlanId } = get()
        if (!force && initializedPlanId === planId) {
          return
        }

        // 重置状态
        set(getInitialState())
        set({ initializedPlanId: planId })

        await Promise.all([
          methods.fetchPlanDetail(planId),
          methods.fetchMaterials(planId, 1),
          methods.fetchGeneratingStats(),
        ])
      },

    }

    return methods
  }),
)
