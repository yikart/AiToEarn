/**
 * 草稿箱 Store
 * 管理当前草稿组详情、素材列表、弹窗状态、批量操作
 */

import type { DraftGroup, DraftMaterial, Pagination } from './types'
import type { MaterialFilterDeleteParams, MaterialListFilters } from '@/api/material'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import {
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

// Store 状态类型
export interface IDraftBoxStoreState {
  // 已初始化的 groupId，用于防止重复请求
  initializedGroupId: string | null

  // 当前草稿组
  currentPlan: DraftGroup | null
  planLoading: boolean

  // 素材列表
  materials: DraftMaterial[]
  materialsLoading: boolean
  materialsPagination: Pagination

  // 弹窗状态
  createMaterialModalOpen: boolean
  editingMaterial: DraftMaterial | null

  // 草稿详情弹窗状态
  draftDetailDialogOpen: boolean
  selectedDraft: DraftMaterial | null

  // 发布弹框状态
  publishDialogOpen: boolean
  publishingDraft: DraftMaterial | null

  // 加载状态
  isSubmitting: boolean

  // AI 批量生成
  generatingCount: number
  generationDetailDialogOpen: boolean

  // 搜索/筛选 & 批量操作
  materialsFilter: MaterialListFilters
  batchMode: boolean
  selectedMaterialIds: string[]
  batchDeleting: boolean
  conditionalDeleteDialogOpen: boolean
}

// 初始状态
const initialState: IDraftBoxStoreState = {
  initializedGroupId: null,

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
  generationDetailDialogOpen: false,

  materialsFilter: {},
  batchMode: false,
  selectedMaterialIds: [],
  batchDeleting: false,
  conditionalDeleteDialogOpen: false,
}

function getInitialState() {
  return lodash.cloneDeep(initialState)
}

export const useDraftBoxStore = create(
  combine(getInitialState(), (set, get) => {
    const methods = {
      // ==================== 草稿组详情 ====================

      fetchPlanDetail: async (groupId: string) => {
        set({ planLoading: true })
        try {
          const res = await apiGetMaterialInfo(groupId)
          const plan = res?.data as DraftGroup
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

      fetchMaterials: async (groupId: string, page: number = 1) => {
        set({ materialsLoading: true })
        try {
          const { materialsPagination, materialsFilter } = get()
          const res = await apiGetMaterialList(groupId, page, materialsPagination.pageSize, materialsFilter)
          const resData = res?.data as { list?: DraftMaterial[], total?: number } | undefined
          const list = (resData?.list || []) as DraftMaterial[]
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

      loadMoreMaterials: async (groupId: string) => {
        const { materialsLoading, materialsPagination, materials, materialsFilter } = get()
        if (materialsLoading || !materialsPagination.hasMore)
          return

        set({ materialsLoading: true })
        try {
          const nextPage = materialsPagination.current + 1
          const res = await apiGetMaterialList(groupId, nextPage, materialsPagination.pageSize, materialsFilter)
          const resData = res?.data as { list?: DraftMaterial[], total?: number } | undefined
          const list = (resData?.list || []) as DraftMaterial[]
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

      deleteMaterial: async (materialId: string): Promise<boolean> => {
        set({ isSubmitting: true })
        try {
          await apiDeleteMaterial(materialId)
          const { currentPlan, materialsPagination } = get()
          if (currentPlan) {
            await methods.fetchMaterials(currentPlan._id, materialsPagination.current)
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

      openEditMaterialModal: (material: DraftMaterial) => {
        set({ createMaterialModalOpen: true, editingMaterial: material })
      },

      closeMaterialModal: () => {
        set({ createMaterialModalOpen: false, editingMaterial: null })
      },

      // ==================== 草稿详情弹窗 ====================

      openDraftDetailDialog: (material: DraftMaterial) => {
        set({ draftDetailDialogOpen: true, selectedDraft: material })
      },

      closeDraftDetailDialog: () => {
        set({ draftDetailDialogOpen: false, selectedDraft: null })
      },

      // ==================== 发布弹框 ====================

      openPublishDialog: (draft: DraftMaterial) => {
        usePublishDialogStorageStore.getState().clearPubData()
        set({ publishDialogOpen: true, publishingDraft: draft })
      },

      closePublishDialog: () => {
        set({ publishDialogOpen: false, publishingDraft: null })
      },

      // ==================== AI 批量生成 ====================

      openGenerationDetailDialog: () => {
        set({ generationDetailDialogOpen: true })
      },

      closeGenerationDetailDialog: () => {
        set({ generationDetailDialogOpen: false })
      },

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

      updateGeneratingCount: (count: number) => {
        set({ generatingCount: count })
      },

      silentRefreshMaterials: async (groupId: string) => {
        try {
          const { materialsPagination, materials, materialsFilter } = get()
          const res = await apiGetMaterialList(groupId, 1, materialsPagination.pageSize, materialsFilter)
          const resData = res?.data as { list?: DraftMaterial[], total?: number } | undefined
          const freshList = (resData?.list || []) as DraftMaterial[]
          const total = resData?.total || 0

          const existingIds = new Set(materials.map(m => m._id))
          const newItems = freshList.filter(item => !existingIds.has(item._id))

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
          methods.fetchMaterials(currentPlan._id, 1)
        }
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
        set({ selectedMaterialIds: materials.map(m => m._id) })
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
          await apiBatchDeleteMaterials(selectedMaterialIds)
          set({ batchMode: false, selectedMaterialIds: [] })
          await methods.fetchMaterials(currentPlan._id, 1)
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
          await apiFilterDeleteMaterials({ ...conditions, groupId: currentPlan._id })
          set({ conditionalDeleteDialogOpen: false })
          await methods.fetchMaterials(currentPlan._id, 1)
          return true
        }
        catch {
          return false
        }
      },

      // ==================== 初始化 ====================

      initDetailPage: async (groupId: string, force: boolean = false) => {
        const { initializedGroupId } = get()
        if (!force && initializedGroupId === groupId) {
          return
        }

        set(getInitialState())
        set({ initializedGroupId: groupId })

        await Promise.all([
          methods.fetchPlanDetail(groupId),
          methods.fetchMaterials(groupId, 1),
          methods.fetchGeneratingStats(),
        ])
      },
    }

    return methods
  }),
)
