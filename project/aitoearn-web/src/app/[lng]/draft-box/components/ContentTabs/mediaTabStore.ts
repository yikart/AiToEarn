/**
 * mediaTabStore - 媒体 Tab 状态管理
 * 管理视频/图片两个列表的独立状态、分页、预览
 */

import type { MediaItem } from '@/api/types/media'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { getMediaList } from '@/api/media'

const PAGE_SIZE = 20

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

export const useMediaTabStore = create(
  combine(
    {
      video: { ...defaultTypeState } as MediaTypeState,
      img: { ...defaultTypeState } as MediaTypeState,
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
       * 重置所有数据（Plan 切换时调用）
       */
      reset: () => {
        set({
          video: { ...defaultTypeState },
          img: { ...defaultTypeState },
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
