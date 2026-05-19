/**
 * 品牌推广详情页 Store
 * 管理当前计划详情、素材列表、发布记录、统计数据
 */

import type {
  Pagination,
  PlanStatistics,
  PromotionMaterial,
  PromotionPlan,
  PublishRecord,
  TrendData,
} from './brandPromotionStore/types'
import type {
  DraftGenerationRequest,
  DraftGenerationTask,
  ImageModelType,
  ImageTextDraftType,
  VideoDraftType,
} from '@/api/draftGeneration'
import type { MaterialFilterDeleteParams, MaterialListFilters } from '@/api/material'
import type { PlatType } from '@/app/config/platConfig'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import {
  apiCreateDraftGeneration,
  apiCreateImageTextDraft,
  apiGetDraftGenerationList,
  apiGetDraftGenerationStats,
  apiQueryDraftGenerationTasks,
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

// 时间范围类型
export type TimeRange = '7d' | '14d' | '30d' | '60d'
type PromotionPostSource = string

const DRAFT_GENERATION_QUERY_BATCH_SIZE = 10

interface BatchGenerationCreateResult {
  success: boolean
  successCount: number
  failedCount: number
  taskCount: number
  errorMessage?: string
}

function isDraftGenerationTaskForGroup(task: DraftGenerationTask, groupId: string) {
  return task.request?.groupId === groupId
}

function sortDraftGenerationTasks(tasks: DraftGenerationTask[]) {
  return [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function countGeneratingTasks(tasks: DraftGenerationTask[]) {
  return tasks.filter(task => task.status === 'generating').length
}

function mergeDraftGenerationTasks(current: DraftGenerationTask[], incoming: DraftGenerationTask[]) {
  const taskMap = new Map<string, DraftGenerationTask>()
  current.forEach(task => taskMap.set(task.id, task))
  incoming.forEach((task) => {
    const currentTask = taskMap.get(task.id)
    taskMap.set(task.id, currentTask ? { ...currentTask, ...task } : task)
  })
  return sortDraftGenerationTasks(Array.from(taskMap.values()))
}

function buildDraftGenerationTaskPlaceholder(
  id: string,
  request: DraftGenerationRequest,
): DraftGenerationTask {
  const now = new Date().toISOString()
  return {
    id,
    status: 'generating',
    points: 0,
    request,
    response: {},
    createdAt: now,
    updatedAt: now,
  }
}

function chunkTaskIds(taskIds: string[]) {
  const chunks: string[][] = []
  for (let i = 0; i < taskIds.length; i += DRAFT_GENERATION_QUERY_BATCH_SIZE) {
    chunks.push(taskIds.slice(i, i + DRAFT_GENERATION_QUERY_BATCH_SIZE))
  }
  return chunks
}

function getSettledErrorMessage(result: PromiseRejectedResult) {
  if (result.reason instanceof Error)
    return result.reason.message
  return typeof result.reason === 'string' ? result.reason : undefined
}

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
  materialsInitialized: boolean
  materialsPagination: Pagination

  // 发布记录
  publishRecords: PublishRecord[]
  publishRecordsLoading: boolean
  publishRecordsPagination: Pagination

  // 统计数据
  statistics: PlanStatistics | null
  statisticsLoading: boolean
  trendData: TrendData | null
  trendTimeRange: TimeRange

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
  generationTasks: DraftGenerationTask[]
  aiBatchModalOpen: boolean
  generationDetailDialogOpen: boolean
  isGeneratingBatch: boolean

  // 搜索/筛选 & 批量操作
  materialsFilter: MaterialListFilters
  batchMode: boolean
  selectedMaterialIds: string[]
  batchDeleting: boolean
  conditionalDeleteDialogOpen: boolean

  // 数据分析数据是否已加载
  analyticsInitialized: boolean
  promotionPostSource?: PromotionPostSource
}

// 初始状态
const initialState: IPlanDetailStoreState = {
  initializedPlanId: null,

  currentPlan: null,
  planLoading: true,

  materials: [],
  materialsLoading: true,
  materialsInitialized: false,
  materialsPagination: {
    current: 1,
    pageSize: 12,
    total: 0,
    hasMore: true,
  },

  publishRecords: [],
  publishRecordsLoading: true,
  publishRecordsPagination: {
    current: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,
  },

  statistics: null,
  statisticsLoading: true,
  trendData: null,
  trendTimeRange: '7d',

  createMaterialModalOpen: false,
  editingMaterial: null,

  draftDetailDialogOpen: false,
  selectedDraft: null,

  publishDialogOpen: false,
  publishingDraft: null,

  isSubmitting: false,

  generatingCount: 0,
  generationTasks: [],
  aiBatchModalOpen: false,
  generationDetailDialogOpen: false,
  isGeneratingBatch: false,

  materialsFilter: {},
  batchMode: false,
  selectedMaterialIds: [],
  batchDeleting: false,
  conditionalDeleteDialogOpen: false,

  analyticsInitialized: false,
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
            materialsInitialized: true,
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

            try {
              const { useMediaTabStore } = await import('@/app/[lng]/draft-box/components/ContentTabs/mediaTabStore')
              const mediaStore = useMediaTabStore.getState()
              if (mediaStore.all.initialized) {
                mediaStore.removeItemsFromAll([materialId], 'draft')
              }
            }
            catch {
              // mediaTabStore 未加载时忽略
            }
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

      // ==================== 发布记录 ====================

      /**
       * 获取发布记录
       */
      fetchPublishRecords: async (_planId: string, page: number = 1, _source?: PromotionPostSource) => {
        const { publishRecordsPagination } = get()
        set({
          publishRecords: [],
          publishRecordsLoading: false,
          publishRecordsPagination: {
            ...publishRecordsPagination,
            current: page,
            total: 0,
            hasMore: false,
          },
        })
      },

      /**
       * 加载更多发布记录（无限滚动）
       */
      loadMorePublishRecords: async (_planId: string) => {
        set({ publishRecordsLoading: false })
      },

      // ==================== 统计数据 ====================

      /**
       * 获取统计数据
       */
      fetchStatistics: async (_planId: string, _source?: PromotionPostSource) => {
        set({
          statistics: {
            materialCount: 0,
            publishCount: 0,
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            favoriteCount: 0,
          },
          statisticsLoading: false,
        })
      },

      /**
       * 获取趋势数据
       */
      fetchTrendData: async (_planId: string, _timeRange: TimeRange, _source?: PromotionPostSource) => {
        set({ trendData: null })
      },

      setTrendTimeRange: (range: TimeRange) => {
        set({ trendTimeRange: range })
        const { currentPlan } = get()
        if (currentPlan) {
          methods.fetchTrendData(currentPlan.id, range)
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

      syncGenerationTasks: (tasks: DraftGenerationTask[]) => {
        const groupId = get().currentPlan?.id || get().initializedPlanId
        const currentTaskIds = new Set(get().generationTasks.map(task => task.id))
        const scopedTasks = groupId
          ? tasks.filter(task => isDraftGenerationTaskForGroup(task, groupId) || currentTaskIds.has(task.id))
          : tasks
        const generationTasks = mergeDraftGenerationTasks(get().generationTasks, scopedTasks)
        set({
          generationTasks,
          generatingCount: countGeneratingTasks(generationTasks),
        })
      },

      replaceGenerationTasks: (tasks: DraftGenerationTask[]) => {
        const groupId = get().currentPlan?.id || get().initializedPlanId
        const generationTasks = sortDraftGenerationTasks(
          groupId ? tasks.filter(task => isDraftGenerationTaskForGroup(task, groupId)) : tasks,
        )
        set({
          generationTasks,
          generatingCount: countGeneratingTasks(generationTasks),
        })
      },

      /**
       * 初始化当前草稿箱生成中任务，用于刷新页面后恢复进度展示
       */
      fetchGenerationTasks: async (planId: string) => {
        try {
          const res = await apiGetDraftGenerationList(1, 100)
          const list = (res?.data?.list || []).filter(
            task => task.status === 'generating' && isDraftGenerationTaskForGroup(task, planId),
          )
          methods.replaceGenerationTasks(list)
        }
        catch {
          // 静默失败
        }
      },

      /**
       * 根据已知 taskIds 刷新生成任务详情
       */
      queryGenerationTasks: async (taskIds: string[]) => {
        if (taskIds.length === 0)
          return []

        try {
          const results = await Promise.all(
            chunkTaskIds(taskIds).map(async (ids) => {
              const res = await apiQueryDraftGenerationTasks(ids)
              return res?.data || []
            }),
          )
          const tasks = results.flat()
          methods.syncGenerationTasks(tasks)
          return tasks
        }
        catch {
          return []
        }
      },

      /**
       * 创建 AI 批量生成任务
       */
      createBatchGeneration: async (
        quantity: number,
        modelType: string,
        duration?: number,
        resolution?: string,
        aspectRatio?: string,
        prompt?: string,
        imageUrls?: string[],
        videoUrls?: string[],
        overrideGroupId?: string,
        platforms?: PlatType[],
        draftType?: VideoDraftType,
        captionPrompt?: string,
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
            resolution,
            aspectRatio,
            prompt,
            captionPrompt: captionPrompt || undefined,
            imageUrls,
            videoUrls,
            platforms: platforms?.length ? platforms : undefined,
            draftType,
          })
          if (res?.code === 0) {
            const taskIds = res.data?.taskIds || []
            methods.syncGenerationTasks(taskIds.map(id => buildDraftGenerationTaskPlaceholder(id, {
              groupId,
              model: modelType,
              duration,
              resolution,
              aspectRatio,
              prompt,
              captionPrompt: captionPrompt || undefined,
              imageUrls,
              videoUrls,
              platforms,
              draftType,
            })))
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
       * 按多个视频模型并发创建 AI 批量生成任务
       */
      createBatchGenerationWithModels: async (
        quantity: number,
        modelTypes: string[],
        duration?: number,
        resolution?: string,
        aspectRatio?: string,
        prompt?: string,
        imageUrls?: string[],
        videoUrls?: string[],
        overrideGroupId?: string,
        platforms?: PlatType[],
        draftType?: VideoDraftType,
        captionPrompt?: string,
      ): Promise<BatchGenerationCreateResult> => {
        const groupId = overrideGroupId || get().currentPlan?.id
        const uniqueModelTypes = [...new Set(modelTypes.filter(Boolean))]
        if (!groupId || uniqueModelTypes.length === 0) {
          return { success: false, successCount: 0, failedCount: uniqueModelTypes.length, taskCount: 0 }
        }

        set({ isGeneratingBatch: true })
        try {
          const results = await Promise.allSettled(
            uniqueModelTypes.map(async (modelType) => {
              const res = await apiCreateDraftGeneration({
                quantity,
                groupId,
                model: modelType,
                duration,
                resolution,
                aspectRatio,
                prompt,
                captionPrompt: captionPrompt || undefined,
                imageUrls,
                videoUrls,
                platforms: platforms?.length ? platforms : undefined,
                draftType,
              })

              if (res?.code !== 0)
                throw new Error(res?.message || 'Failed to create generation task')

              return {
                modelType,
                taskIds: res.data?.taskIds || [],
              }
            }),
          )

          const fulfilled = results.filter((result): result is PromiseFulfilledResult<{ modelType: string, taskIds: string[] }> => result.status === 'fulfilled')
          const placeholders = fulfilled.flatMap(({ value }) => value.taskIds.map(id => buildDraftGenerationTaskPlaceholder(id, {
            groupId,
            model: value.modelType,
            duration,
            resolution,
            aspectRatio,
            prompt,
            captionPrompt: captionPrompt || undefined,
            imageUrls,
            videoUrls,
            platforms,
            draftType,
          })))

          if (placeholders.length > 0)
            methods.syncGenerationTasks(placeholders)

          const failed = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
          return {
            success: fulfilled.length > 0,
            successCount: fulfilled.length,
            failedCount: failed.length,
            taskCount: placeholders.length,
            errorMessage: failed.map(getSettledErrorMessage).find(Boolean),
          }
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
        captionPrompt?: string,
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
            captionPrompt: captionPrompt || undefined,
            imageModel,
            imageCount,
            imageUrls,
            aspectRatio,
            imageSize,
            platforms: platforms?.length ? platforms : undefined,
            draftType,
          })
          if (res?.code === 0) {
            const taskIds = res.data?.taskIds || []
            methods.syncGenerationTasks(taskIds.map(id => buildDraftGenerationTaskPlaceholder(id, {
              groupId,
              imageModel,
              prompt,
              captionPrompt: captionPrompt || undefined,
              imageCount,
              imageUrls,
              aspectRatio,
              imageSize,
              platforms,
              draftType,
            })))
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
       * 按多个图片模型并发创建 AI 图文批量生成任务
       */
      createImageTextBatchGenerationWithModels: async (
        quantity: number,
        imageModels: ImageModelType[],
        prompt: string,
        imageCount?: number,
        aspectRatio?: string,
        imageUrls?: string[],
        overrideGroupId?: string,
        imageSize?: string,
        platforms?: PlatType[],
        draftType?: ImageTextDraftType,
        captionPrompt?: string,
      ): Promise<BatchGenerationCreateResult> => {
        const groupId = overrideGroupId || get().currentPlan?.id
        const uniqueImageModels = [...new Set(imageModels.filter(Boolean))]
        if (!groupId || uniqueImageModels.length === 0) {
          return { success: false, successCount: 0, failedCount: uniqueImageModels.length, taskCount: 0 }
        }

        set({ isGeneratingBatch: true })
        try {
          const results = await Promise.allSettled(
            uniqueImageModels.map(async (imageModel) => {
              const res = await apiCreateImageTextDraft({
                quantity,
                groupId,
                prompt,
                captionPrompt: captionPrompt || undefined,
                imageModel,
                imageCount,
                imageUrls,
                aspectRatio,
                imageSize,
                platforms: platforms?.length ? platforms : undefined,
                draftType,
              })

              if (res?.code !== 0)
                throw new Error(res?.message || 'Failed to create generation task')

              return {
                imageModel,
                taskIds: res.data?.taskIds || [],
              }
            }),
          )

          const fulfilled = results.filter((result): result is PromiseFulfilledResult<{ imageModel: ImageModelType, taskIds: string[] }> => result.status === 'fulfilled')
          const placeholders = fulfilled.flatMap(({ value }) => value.taskIds.map(id => buildDraftGenerationTaskPlaceholder(id, {
            groupId,
            imageModel: value.imageModel,
            prompt,
            captionPrompt: captionPrompt || undefined,
            imageCount,
            imageUrls,
            aspectRatio,
            imageSize,
            platforms,
            draftType,
          })))

          if (placeholders.length > 0)
            methods.syncGenerationTasks(placeholders)

          const failed = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
          return {
            success: fulfilled.length > 0,
            successCount: fulfilled.length,
            failedCount: failed.length,
            taskCount: placeholders.length,
            errorMessage: failed.map(getSettledErrorMessage).find(Boolean),
          }
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

      /**
       * 外部写入草稿数据（不发请求）
       * 用于 mediaTabStore.fetchAllList 初始加载后同步草稿到 planDetailStore
       */
      setMaterialsFromExternal: (list: PromotionMaterial[], total: number, pageSize: number) => {
        set({
          materials: list,
          materialsInitialized: true,
          materialsLoading: false,
          materialsPagination: {
            current: 1,
            pageSize,
            total,
            hasMore: list.length < total,
          },
        })
      },

      /**
       * 外部同步新增草稿（不发请求，prepend 新增项）
       * 用于 mediaTabStore.silentRefreshAll 后同步新增草稿
       */
      syncMaterialsFromFresh: (freshList: PromotionMaterial[], total: number) => {
        const { materials, materialsPagination } = get()
        const existingIds = new Set(materials.map(m => m.id))
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
      },

      /**
       * 外部追加草稿（不发请求）
       * 用于 mediaTabStore.loadMoreAll 加载更多草稿后同步
       */
      appendMaterials: (list: PromotionMaterial[], total: number) => {
        const { materials, materialsPagination } = get()
        // 去重后追加
        const existingIds = new Set(materials.map(m => m.id))
        const newItems = list.filter(item => !existingIds.has(item.id))
        if (newItems.length > 0) {
          set({
            materials: [...materials, ...newItems],
            materialsPagination: {
              ...materialsPagination,
              total,
              hasMore: (materials.length + newItems.length) < total,
            },
          })
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
          // 同步更新全部 Tab
          const { useMediaTabStore } = await import('@/app/[lng]/draft-box/components/ContentTabs/mediaTabStore')
          useMediaTabStore.getState().removeItemsFromAll(selectedMaterialIds, 'draft')
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
          // 条件删除无法确定删除了哪些 ID，重新拉取全部 Tab
          try {
            const { useMediaTabStore } = await import('@/app/[lng]/draft-box/components/ContentTabs/mediaTabStore')
            const mediaStore = useMediaTabStore.getState()
            if (mediaStore.all.initialized) {
              mediaStore.fetchAllList(currentPlan.id, currentPlan.id)
            }
          }
          catch {
            // mediaTabStore 未加载时忽略
          }
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
      initDetailPage: async (planId: string, force: boolean = false, options?: { source?: PromotionPostSource }) => {
        // 如果已经初始化过相同的 planId 且非强制刷新，跳过
        const { initializedPlanId } = get()
        if (!force && initializedPlanId === planId) {
          return
        }

        // 重置状态
        set(getInitialState())
        // 标记正在初始化的 planId
        set({ initializedPlanId: planId, promotionPostSource: options?.source })

        // 并行加载数据
        await Promise.all([
          methods.fetchPlanDetail(planId),
          methods.fetchMaterials(planId, 1),
          methods.fetchStatistics(planId, options?.source),
          methods.fetchPublishRecords(planId, 1, options?.source),
          methods.fetchTrendData(planId, '7d', options?.source),
          methods.fetchGenerationTasks(planId),
        ])
      },

      /**
       * 仅加载「内容管理」所需数据
       * 加载: planDetail + materials + generatingStats
       */
      initContentData: async (planId: string, force: boolean = false, options?: { skipMaterials?: boolean }) => {
        const { initializedPlanId } = get()
        if (!force && initializedPlanId === planId) {
          return
        }

        // 重置状态
        set(getInitialState())
        set({ initializedPlanId: planId })

        if (options?.skipMaterials) {
          // 跳过素材加载时，将 loading 置为 false 避免骨架屏卡住
          set({ materialsLoading: false })
          await Promise.all([
            methods.fetchPlanDetail(planId),
            methods.fetchGenerationTasks(planId),
          ])
        }
        else {
          await Promise.all([
            methods.fetchPlanDetail(planId),
            methods.fetchMaterials(planId, 1),
            methods.fetchGenerationTasks(planId),
          ])
        }
      },

      /**
       * 仅加载「数据分析」所需数据
       * 加载: statistics + publishRecords + trendData
       * planDetail 复用已加载的缓存
       */
      initAnalyticsData: async (planId: string, force: boolean = false, options?: { source?: PromotionPostSource }) => {
        const { analyticsInitialized } = get()
        if (!force && analyticsInitialized) {
          return
        }

        set({ analyticsInitialized: true, promotionPostSource: options?.source })

        await Promise.all([
          methods.fetchStatistics(planId, options?.source),
          methods.fetchPublishRecords(planId, 1, options?.source),
          methods.fetchTrendData(planId, '7d', options?.source),
        ])
      },
    }

    return methods
  }),
)
