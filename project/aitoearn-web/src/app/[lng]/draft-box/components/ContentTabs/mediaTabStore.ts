/**
 * mediaTabStore - 媒体 Tab 状态管理
 * 管理视频/图片两个列表的独立状态、分页、预览
 * 以及"全部"Tab 的三路合并数据
 */

import type { MediaItem } from '@/api/types/media'
import type { PromotionMaterial } from '@/app/[lng]/brand-promotion/brandPromotionStore/types'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { apiGetMaterialList } from '@/api/material'
import { getMediaList } from '@/api/media'

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

          results.forEach((res, i) => {
            const type = fetchTypes[i]
            const list = res?.data?.list || []
            const total = res?.data?.total || 0

            if (type === 'draft') {
              newDraftPage += 1
              newDraftTotal = total
              newDraftHasMore = (current.mergedList.filter(item => item.source === 'draft').length + list.length) < total
              newItems.push(...list.map(materialToAllItem))
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
        }
        catch {
          // 静默失败
        }
      },

      /**
       * 重置所有数据（Plan 切换时调用）
       */
      reset: () => {
        set({
          video: { ...defaultTypeState },
          img: { ...defaultTypeState },
          all: { ...defaultAllState },
          previewOpen: false,
          previewIndex: 0,
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
    }),
  ),
)
