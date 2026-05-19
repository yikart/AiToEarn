/**
 * mediaTabStore - 媒体 Tab 状态管理
 * 管理视频/图片两个列表的独立状态、分页、预览
 * 以及"全部"Tab 的三路合并数据
 * 支持批量选择和删除（视频/图片/全部 Tab）
 */

import type { MediaItem } from '@/api/types/media'
import type { PromotionMaterial } from '@/app/[lng]/brand-promotion/brandPromotionStore/types'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { apiCreateDraftFromVideoUrl } from '@/api/draftGeneration'
import { apiBatchDeleteMaterials, apiGetMaterialList } from '@/api/material'
import { batchDeleteMedia, getMediaList } from '@/api/media'
import { getOssUrl } from '@/utils/oss'

const PAGE_SIZE = 20
const ALL_PAGE_SIZE = 20

interface MediaTypeState {
  list: MediaItem[]
  loading: boolean
  total: number
  page: number
  hasMore: boolean
  initialized: boolean
}

const defaultTypeState: MediaTypeState = {
  list: [],
  loading: false,
  total: 0,
  page: 1,
  hasMore: true,
  initialized: false,
}

/** 全部 Tab 统一数据项 */
export interface AllTabItem {
  source: 'draft' | 'video' | 'img'
  id: string
  createdAt: string
  data: PromotionMaterial | MediaItem
}

export interface VideoDraftCreationTask {
  mediaId: string
  mediaTitle: string
  groupId: string
  videoUrl: string
  platforms: string[]
  startedAt: number
}

interface AllTabState {
  mergedList: AllTabItem[]
  loading: boolean
  initialized: boolean
  allExhausted: boolean
  draftPage: number
  draftHasMore: boolean
  draftTotal: number
  videoPage: number
  videoHasMore: boolean
  videoTotal: number
  imgPage: number
  imgHasMore: boolean
  imgTotal: number
}

const defaultAllState: AllTabState = {
  mergedList: [],
  loading: false,
  initialized: false,
  allExhausted: false,
  draftPage: 1,
  draftHasMore: true,
  draftTotal: 0,
  videoPage: 1,
  videoHasMore: true,
  videoTotal: 0,
  imgPage: 1,
  imgHasMore: true,
  imgTotal: 0,
}

/** 将草稿转换为 AllTabItem */
function materialToAllItem(m: PromotionMaterial): AllTabItem {
  return { source: 'draft', id: m.id, createdAt: m.createdAt || '', data: m }
}

/** 将媒体转换为 AllTabItem */
function mediaToAllItem(m: MediaItem, source: 'video' | 'img'): AllTabItem {
  return { source, id: m._id, createdAt: m.createdAt || '', data: m }
}

/** 按 createdAt 降序排序 */
function sortByCreatedAtDesc(items: AllTabItem[]): AllTabItem[] {
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const useMediaTabStore = create(
  combine(
    {
      video: { ...defaultTypeState } as MediaTypeState,
      img: { ...defaultTypeState } as MediaTypeState,
      all: { ...defaultAllState } as AllTabState,
      // 预览状态
      previewOpen: false,
      previewIndex: 0,
      previewType: 'video' as 'video' | 'img',
      // 批量模式状态
      batchMode: false,
      /** id → source 映射，用于全部 Tab 的混合删除 */
      selectedItems: {} as Record<string, 'draft' | 'video' | 'img'>,
      batchDeleting: false,
      /** 视频素材生成草稿 loading */
      creatingDraftMap: {} as Record<string, boolean>,
      /** 视频生成草稿长任务 */
      draftCreationTasks: {} as Record<string, VideoDraftCreationTask>,
      /** 视频生成草稿悬浮窗是否折叠 */
      draftCreationWidgetMinimized: false,
    },
    (set, get) => ({
      /**
       * 获取媒体列表（首次加载）
       */
      fetchMediaList: async (materialGroupId: string, type: 'video' | 'img') => {
        const state = get()[type]
        if (state.loading)
          return

        set(prev => ({
          [type]: { ...prev[type], loading: true },
        }))

        try {
          const res = await getMediaList({ materialGroupId }, 1, PAGE_SIZE, type)
          if (res?.data) {
            const list = res.data.list || []
            const total = res.data.total || 0
            set({
              [type]: {
                list,
                loading: false,
                total,
                page: 1,
                hasMore: list.length < total,
                initialized: true,
              },
            })
          }
          else {
            set(prev => ({
              [type]: { ...prev[type], loading: false, initialized: true },
            }))
          }
        }
        catch (error) {
          console.error(`Failed to fetch ${type} media list:`, error)
          set(prev => ({
            [type]: { ...prev[type], loading: false, initialized: true },
          }))
        }
      },

      /**
       * 加载更多
       */
      loadMore: async (materialGroupId: string, type: 'video' | 'img') => {
        const state = get()[type]
        if (state.loading || !state.hasMore)
          return

        const nextPage = state.page + 1
        set(prev => ({
          [type]: { ...prev[type], loading: true },
        }))

        try {
          const res = await getMediaList({ materialGroupId }, nextPage, PAGE_SIZE, type)
          if (res?.data) {
            const newList = res.data.list || []
            const total = res.data.total || 0
            const combinedList = [...state.list, ...newList]
            set({
              [type]: {
                list: combinedList,
                loading: false,
                total,
                page: nextPage,
                hasMore: combinedList.length < total,
                initialized: true,
              },
            })
          }
          else {
            set(prev => ({
              [type]: { ...prev[type], loading: false, hasMore: false },
            }))
          }
        }
        catch (error) {
          console.error(`Failed to load more ${type} media:`, error)
          set(prev => ({
            [type]: { ...prev[type], loading: false },
          }))
        }
      },

      /**
       * 获取全部列表（首次加载，三路并行）
       */
      fetchAllList: async (materialGroupId: string, planId: string) => {
        const { all } = get()
        if (all.loading)
          return

        set({ all: { ...get().all, loading: true } })

        try {
          const [draftRes, videoRes, imgRes] = await Promise.all([
            apiGetMaterialList(planId, 1, ALL_PAGE_SIZE),
            getMediaList({ materialGroupId }, 1, ALL_PAGE_SIZE, 'video'),
            getMediaList({ materialGroupId }, 1, ALL_PAGE_SIZE, 'img'),
          ])

          const draftList = draftRes?.data?.list || []
          const draftTotal = draftRes?.data?.total || 0
          const videoList = videoRes?.data?.list || []
          const videoTotal = videoRes?.data?.total || 0
          const imgList = imgRes?.data?.list || []
          const imgTotal = imgRes?.data?.total || 0

          const allItems: AllTabItem[] = [
            ...draftList.map(materialToAllItem),
            ...videoList.map(m => mediaToAllItem(m, 'video')),
            ...imgList.map(m => mediaToAllItem(m, 'img')),
          ]

          const draftHasMore = draftList.length < draftTotal
          const videoHasMore = videoList.length < videoTotal
          const imgHasMore = imgList.length < imgTotal

          set({
            all: {
              mergedList: sortByCreatedAtDesc(allItems),
              loading: false,
              initialized: true,
              allExhausted: !draftHasMore && !videoHasMore && !imgHasMore,
              draftPage: 1,
              draftHasMore,
              draftTotal,
              videoPage: 1,
              videoHasMore,
              videoTotal,
              imgPage: 1,
              imgHasMore,
              imgTotal,
            },
          })

          // 同步草稿数据到 planDetailStore，"草稿"tab 直接复用，不再重复请求
          try {
            const { usePlanDetailStore } = await import('@/app/[lng]/brand-promotion/planDetailStore')
            usePlanDetailStore.getState().setMaterialsFromExternal(draftList, draftTotal, ALL_PAGE_SIZE)
          }
          catch {
            // planDetailStore 未加载时忽略
          }
        }
        catch (error) {
          console.error('Failed to fetch all list:', error)
          set({ all: { ...get().all, loading: false, initialized: true } })
        }
      },

      /**
       * 加载更多全部列表
       */
      loadMoreAll: async (materialGroupId: string, planId: string) => {
        const { all } = get()
        if (all.loading || all.allExhausted)
          return

        set({ all: { ...all, loading: true } })

        try {
          const fetches: Promise<any>[] = []
          const fetchTypes: ('draft' | 'video' | 'img')[] = []

          if (all.draftHasMore) {
            fetches.push(apiGetMaterialList(planId, all.draftPage + 1, ALL_PAGE_SIZE))
            fetchTypes.push('draft')
          }
          if (all.videoHasMore) {
            fetches.push(getMediaList({ materialGroupId }, all.videoPage + 1, ALL_PAGE_SIZE, 'video'))
            fetchTypes.push('video')
          }
          if (all.imgHasMore) {
            fetches.push(getMediaList({ materialGroupId }, all.imgPage + 1, ALL_PAGE_SIZE, 'img'))
            fetchTypes.push('img')
          }

          const results = await Promise.all(fetches)

          const current = get().all
          let newDraftPage = current.draftPage
          let newDraftHasMore = current.draftHasMore
          let newDraftTotal = current.draftTotal
          let newVideoPage = current.videoPage
          let newVideoHasMore = current.videoHasMore
          let newVideoTotal = current.videoTotal
          let newImgPage = current.imgPage
          let newImgHasMore = current.imgHasMore
          let newImgTotal = current.imgTotal
          const newItems: AllTabItem[] = []
          let newDraftList: any[] = []

          results.forEach((res, i) => {
            const type = fetchTypes[i]
            const list = res?.data?.list || []
            const total = res?.data?.total || 0

            if (type === 'draft') {
              newDraftPage += 1
              newDraftTotal = total
              newDraftHasMore = (current.mergedList.filter(item => item.source === 'draft').length + list.length) < total
              newItems.push(...list.map(materialToAllItem))
              newDraftList = list
            }
            else if (type === 'video') {
              newVideoPage += 1
              newVideoTotal = total
              newVideoHasMore = (current.mergedList.filter(item => item.source === 'video').length + list.length) < total
              newItems.push(...list.map((m: MediaItem) => mediaToAllItem(m, 'video')))
            }
            else if (type === 'img') {
              newImgPage += 1
              newImgTotal = total
              newImgHasMore = (current.mergedList.filter(item => item.source === 'img').length + list.length) < total
              newItems.push(...list.map((m: MediaItem) => mediaToAllItem(m, 'img')))
            }
          })

          const mergedList = sortByCreatedAtDesc([...current.mergedList, ...newItems])

          set({
            all: {
              mergedList,
              loading: false,
              initialized: true,
              allExhausted: !newDraftHasMore && !newVideoHasMore && !newImgHasMore,
              draftPage: newDraftPage,
              draftHasMore: newDraftHasMore,
              draftTotal: newDraftTotal,
              videoPage: newVideoPage,
              videoHasMore: newVideoHasMore,
              videoTotal: newVideoTotal,
              imgPage: newImgPage,
              imgHasMore: newImgHasMore,
              imgTotal: newImgTotal,
            },
          })

          // 同步新增草稿到 planDetailStore
          if (newDraftList.length > 0) {
            try {
              const { usePlanDetailStore } = await import('@/app/[lng]/brand-promotion/planDetailStore')
              usePlanDetailStore.getState().appendMaterials(newDraftList, newDraftTotal)
            }
            catch {
              // planDetailStore 未加载时忽略
            }
          }
        }
        catch (error) {
          console.error('Failed to load more all list:', error)
          set({ all: { ...get().all, loading: false } })
        }
      },

      /**
       * 静默刷新全部列表（轮询完成时调用）
       */
      silentRefreshAll: async (materialGroupId: string, planId: string) => {
        const { all } = get()
        if (!all.initialized)
          return

        try {
          const [draftRes, videoRes, imgRes] = await Promise.all([
            apiGetMaterialList(planId, 1, ALL_PAGE_SIZE),
            getMediaList({ materialGroupId }, 1, ALL_PAGE_SIZE, 'video'),
            getMediaList({ materialGroupId }, 1, ALL_PAGE_SIZE, 'img'),
          ])

          const freshDrafts = (draftRes?.data?.list || []).map(materialToAllItem)
          const freshVideos = (videoRes?.data?.list || []).map((m: MediaItem) => mediaToAllItem(m, 'video'))
          const freshImgs = (imgRes?.data?.list || []).map((m: MediaItem) => mediaToAllItem(m, 'img'))

          const current = get().all
          const existingIds = new Set(current.mergedList.map(item => item.id))
          const newItems = [...freshDrafts, ...freshVideos, ...freshImgs].filter(item => !existingIds.has(item.id))

          if (newItems.length > 0) {
            set({
              all: {
                ...current,
                mergedList: sortByCreatedAtDesc([...newItems, ...current.mergedList]),
                draftTotal: draftRes?.data?.total || current.draftTotal,
                videoTotal: videoRes?.data?.total || current.videoTotal,
                imgTotal: imgRes?.data?.total || current.imgTotal,
              },
            })
          }

          // 同步草稿数据到 planDetailStore
          try {
            const draftList = draftRes?.data?.list || []
            const draftTotal = draftRes?.data?.total || 0
            const { usePlanDetailStore } = await import('@/app/[lng]/brand-promotion/planDetailStore')
            usePlanDetailStore.getState().syncMaterialsFromFresh(draftList, draftTotal)
          }
          catch {
            // planDetailStore 未加载时忽略
          }
        }
        catch {
          // 静默失败
        }
      },

      /**
       * 重置所有数据（Plan 切换时调用）
       */
      reset: () => {
        const {
          creatingDraftMap,
          draftCreationTasks,
          draftCreationWidgetMinimized,
        } = get()

        set({
          video: { ...defaultTypeState },
          img: { ...defaultTypeState },
          all: { ...defaultAllState },
          previewOpen: false,
          previewIndex: 0,
          batchMode: false,
          selectedItems: {},
          batchDeleting: false,
          creatingDraftMap,
          draftCreationTasks,
          draftCreationWidgetMinimized,
        })
      },

      /**
       * 静默刷新已初始化的媒体列表（轮询完成时调用）
       */
      silentRefresh: async (materialGroupId: string) => {
        const state = get()
        const types = (['video', 'img'] as const).filter(t => state[t].initialized)

        await Promise.all(types.map(async (type) => {
          try {
            const current = get()[type]
            const res = await getMediaList({ materialGroupId }, 1, PAGE_SIZE, type)
            if (res?.data) {
              const freshList = res.data.list || []
              const total = res.data.total || 0
              // 构建当前列表的 _id Set
              const existingIds = new Set(current.list.map(m => m._id))
              // 找出新增项
              const newItems = freshList.filter(item => !existingIds.has(item._id))
              if (newItems.length > 0) {
                set({
                  [type]: {
                    ...current,
                    list: [...newItems, ...current.list],
                    total,
                  },
                })
              }
            }
          }
          catch {
            // 静默失败
          }
        }))
      },

      /**
       * 打开预览
       */
      openPreview: (type: 'video' | 'img', index: number) => {
        set({ previewOpen: true, previewIndex: index, previewType: type })
      },

      /**
       * 关闭预览
       */
      closePreview: () => {
        set({ previewOpen: false })
      },

      setDraftCreationWidgetMinimized: (minimized: boolean) => {
        set({ draftCreationWidgetMinimized: minimized })
      },

      /**
       * 根据视频素材生成草稿
       */
      createDraftFromVideo: async ({
        mediaId,
        videoUrl,
        groupId,
        platforms,
        mediaTitle,
      }: {
        mediaId: string
        videoUrl: string
        groupId: string
        platforms?: string[]
        mediaTitle?: string
      }) => {
        if (get().creatingDraftMap[mediaId]) {
          return {
            success: false as const,
          }
        }

        set(state => ({
          creatingDraftMap: {
            ...state.creatingDraftMap,
            [mediaId]: true,
          },
          draftCreationTasks: {
            ...state.draftCreationTasks,
            [mediaId]: {
              mediaId,
              mediaTitle: mediaTitle?.trim() || '',
              groupId,
              videoUrl,
              platforms: platforms || [],
              startedAt: Date.now(),
            },
          },
          draftCreationWidgetMinimized: Object.keys(state.draftCreationTasks).length > 0
            ? state.draftCreationWidgetMinimized
            : false,
        }))

        try {
          const res = await apiCreateDraftFromVideoUrl({
            videoUrl: getOssUrl(videoUrl),
            groupId,
            platforms,
          })

          if (res?.code !== 0 || !res?.data?.materialId) {
            return {
              success: false as const,
              message: res?.message,
            }
          }

          const refreshTasks: Promise<unknown>[] = []

          try {
            const { usePlanDetailStore } = await import('@/app/[lng]/brand-promotion/planDetailStore')
            const planStore = usePlanDetailStore.getState()
            const isCurrentPlan = planStore.currentPlan?.id === groupId

            if (isCurrentPlan) {
              if (get().all.initialized) {
                refreshTasks.push(useMediaTabStore.getState().silentRefreshAll(groupId, groupId))
              }
              else {
                refreshTasks.push(planStore.silentRefreshMaterials(groupId))
              }
            }
          }
          catch {
            // planDetailStore 未加载时忽略
          }

          if (refreshTasks.length > 0) {
            await Promise.all(refreshTasks)
          }

          return {
            success: true as const,
            materialId: res.data.materialId,
          }
        }
        catch {
          return {
            success: false as const,
          }
        }
        finally {
          set((state) => {
            const nextCreatingDraftMap = { ...state.creatingDraftMap }
            const nextDraftCreationTasks = { ...state.draftCreationTasks }
            delete nextCreatingDraftMap[mediaId]
            delete nextDraftCreationTasks[mediaId]

            return {
              creatingDraftMap: nextCreatingDraftMap,
              draftCreationTasks: nextDraftCreationTasks,
            }
          })
        }
      },

      // ===== 批量模式 =====

      enterBatchMode: () => {
        set({ batchMode: true, selectedItems: {} })
      },

      exitBatchMode: () => {
        set({ batchMode: false, selectedItems: {} })
      },

      toggleSelection: (id: string, source: 'draft' | 'video' | 'img') => {
        const { selectedItems } = get()
        const newSelected = { ...selectedItems }
        if (newSelected[id]) {
          delete newSelected[id]
        }
        else {
          newSelected[id] = source
        }
        set({ selectedItems: newSelected })
      },

      /** 全选当前已加载的列表项（按 Tab 类型） */
      selectAllLoaded: (tab: 'video' | 'img' | 'all') => {
        const state = get()
        const newSelected: Record<string, 'draft' | 'video' | 'img'> = {}

        if (tab === 'all') {
          state.all.mergedList.forEach((item) => {
            newSelected[item.id] = item.source
          })
        }
        else {
          state[tab].list.forEach((media) => {
            newSelected[media._id] = tab
          })
        }

        set({ selectedItems: newSelected })
      },

      deselectAll: () => {
        set({ selectedItems: {} })
      },

      /** 获取当前选中数量 */
      getSelectedCount: () => {
        return Object.keys(get().selectedItems).length
      },

      /**
       * 批量删除媒体（视频/图片 Tab）
       * 删除成功后重新拉取列表
       */
      batchDeleteByType: async (materialGroupId: string, type: 'video' | 'img') => {
        const { selectedItems } = get()
        const ids = Object.entries(selectedItems)
          .filter(([_, source]) => source === type)
          .map(([id]) => id)

        if (ids.length === 0)
          return false

        set({ batchDeleting: true })
        try {
          const res = await batchDeleteMedia(ids)
          if (res?.code !== 0)
            return false

          // 从列表中移除已删除项
          const deletedSet = new Set(ids)
          const current = get()[type]
          const newList = current.list.filter(m => !deletedSet.has(m._id))
          set({
            [type]: {
              ...current,
              list: newList,
              total: current.total - ids.length,
            },
            batchMode: false,
            selectedItems: {},
          })

          // 同步更新全部 Tab
          const methods = useMediaTabStore.getState()
          methods.removeItemsFromAll(ids, type)

          return true
        }
        catch {
          return false
        }
        finally {
          set({ batchDeleting: false })
        }
      },

      /**
       * 批量删除全部 Tab（混合删除）
       * 按 source 分组，草稿调 apiBatchDeleteMaterials，媒体调 batchDeleteMedia
       */
      batchDeleteAll: async (materialGroupId: string, planId: string) => {
        const { selectedItems } = get()
        const entries = Object.entries(selectedItems)
        if (entries.length === 0)
          return false

        // 按 source 分组
        const draftIds: string[] = []
        const mediaIds: string[] = []
        entries.forEach(([id, source]) => {
          if (source === 'draft') {
            draftIds.push(id)
          }
          else {
            mediaIds.push(id)
          }
        })

        set({ batchDeleting: true })
        try {
          const promises: Promise<any>[] = []
          if (draftIds.length > 0) {
            promises.push(apiBatchDeleteMaterials(draftIds))
          }
          if (mediaIds.length > 0) {
            promises.push(batchDeleteMedia(mediaIds))
          }

          const results = await Promise.all(promises)
          const allSuccess = results.every(res => res?.code === 0)
          if (!allSuccess)
            return false

          // 从 all.mergedList 中移除已删除项
          const deletedSet = new Set(entries.map(([id]) => id))
          const current = get().all
          const newMergedList = current.mergedList.filter(item => !deletedSet.has(item.id))

          const videoDeletedIds = entries.filter(([_, s]) => s === 'video').map(([id]) => id)
          const imgDeletedIds = entries.filter(([_, s]) => s === 'img').map(([id]) => id)

          set({
            all: {
              ...current,
              mergedList: newMergedList,
              draftTotal: current.draftTotal - draftIds.length,
              videoTotal: current.videoTotal - videoDeletedIds.length,
              imgTotal: current.imgTotal - imgDeletedIds.length,
            },
            batchMode: false,
            selectedItems: {},
          })
          const state = get()

          if (videoDeletedIds.length > 0 && state.video.initialized) {
            const videoDeletedSet = new Set(videoDeletedIds)
            set({
              video: {
                ...state.video,
                list: state.video.list.filter(m => !videoDeletedSet.has(m._id)),
                total: state.video.total - videoDeletedIds.length,
              },
            })
          }

          if (imgDeletedIds.length > 0 && state.img.initialized) {
            const imgDeletedSet = new Set(imgDeletedIds)
            set({
              img: {
                ...state.img,
                list: state.img.list.filter(m => !imgDeletedSet.has(m._id)),
                total: state.img.total - imgDeletedIds.length,
              },
            })
          }

          // 同步 planDetailStore 中的草稿列表
          if (draftIds.length > 0) {
            try {
              const { usePlanDetailStore } = await import('@/app/[lng]/brand-promotion/planDetailStore')
              const planStore = usePlanDetailStore.getState()
              if (planStore.currentPlan) {
                planStore.fetchMaterials(planStore.currentPlan.id, 1)
              }
            }
            catch {
              // planDetailStore 未加载时忽略
            }
          }

          return true
        }
        catch {
          return false
        }
        finally {
          set({ batchDeleting: false })
        }
      },

      /**
       * 从全部 Tab 的 mergedList 中移除指定项（供外部 store 调用）
       */
      removeItemsFromAll: (ids: string[], source: 'draft' | 'video' | 'img') => {
        const { all } = get()
        if (!all.initialized)
          return

        const deletedSet = new Set(ids)
        const newMergedList = all.mergedList.filter(item => !deletedSet.has(item.id))

        const totalKey = `${source === 'draft' ? 'draft' : source}Total` as 'draftTotal' | 'videoTotal' | 'imgTotal'
        set({
          all: {
            ...all,
            mergedList: newMergedList,
            [totalKey]: Math.max(0, all[totalKey] - ids.length),
          },
        })
      },
    }),
  ),
)
