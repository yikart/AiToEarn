/**
 * materialStore - 素材库页面状态管理
 * 管理素材分组的 CRUD 操作和 UI 状态
 */

import type {
  CreateGroupData,
  FilterType,
  IMaterialStore,
  MediaGroup,
  UpdateGroupData,
} from './materialStore.types'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import {
  createMediaGroup,
  deleteMediaGroup,
  getMediaGroupList,
  updateMediaGroupInfo,
} from '@/api/media'
import { toast } from '@/lib/toast'
import { getOssUrl } from '@/utils/oss'

// 导出类型
export type { CreateGroupData, FilterType, IMaterialStore, MediaGroup, UpdateGroupData }

/**
 * 初始状态
 */
const initialState: IMaterialStore = {
  // 数据
  groups: [],
  total: 0,
  defaultImgGroup: null,
  defaultVideoGroup: null,

  // 加载状态
  isLoading: false,
  isSubmitting: false,
  isDeleting: false,

  // 分页
  currentPage: 1,
  pageSize: 12,

  // 筛选
  filterType: 'all',
  searchText: '',

  // 弹窗状态
  createModalOpen: false,
  editingGroup: null,
}

/**
 * 获取初始状态的深拷贝
 */
function getInitialState(): IMaterialStore {
  return lodash.cloneDeep(initialState)
}

/**
 * 素材库 Store
 */
export const useMaterialStore = create(
  combine({ ...getInitialState() }, (set, get) => {
    const methods = {
      /**
       * 重置 Store 到初始状态
       */
      reset() {
        set(getInitialState())
      },

      /**
       * 设置筛选类型并重新加载
       */
      setFilterType(filterType: FilterType) {
        set({ filterType, currentPage: 1 })
        methods.fetchGroups()
      },

      /**
       * 设置搜索文本（不自动加载，由组件控制防抖）
       */
      setSearchText(searchText: string) {
        set({ searchText })
      },

      /**
       * 设置当前页码并重新加载
       */
      setCurrentPage(page: number) {
        set({ currentPage: page })
        methods.fetchGroups()
      },

      /**
       * 打开创建弹窗
       */
      openCreateModal() {
        set({ createModalOpen: true, editingGroup: null })
      },

      /**
       * 打开编辑弹窗
       */
      openEditModal(group: MediaGroup) {
        set({ createModalOpen: true, editingGroup: group })
      },

      /**
       * 关闭创建/编辑弹窗
       */
      closeCreateModal() {
        set({ createModalOpen: false, editingGroup: null })
      },

      /**
       * 处理分组数据，提取封面和资源数量
       */
      processGroups(list: MediaGroup[]): MediaGroup[] {
        return list.map((group) => {
          const mediaList = group.mediaList

          // 查找第一个媒体作为预览
          let previewMedia = null
          if (mediaList && mediaList.list && mediaList.list.length > 0) {
            previewMedia = mediaList.list[0]
          }

          return {
            ...group,
            // 使用缩略图作为封面（thumbUrl 优先）
            cover: previewMedia ? getOssUrl(previewMedia.thumbUrl || previewMedia.url) : undefined,
            // 使用 mediaList 的 total 作为资源数量
            count: mediaList ? mediaList.total : 0,
            // 保存预览媒体信息（包含 thumbUrl）
            previewMedia: previewMedia
              ? {
                  type: previewMedia.type,
                  url: previewMedia.url,
                  thumbUrl: previewMedia.thumbUrl,
                }
              : null,
          }
        })
      },

      /**
       * 获取分组列表
       */
      async fetchGroups() {
        const { currentPage, pageSize, filterType } = get()
        set({ isLoading: true })

        try {
          const typeParam = filterType === 'all' ? undefined : filterType
          const response = await getMediaGroupList(currentPage, pageSize, typeParam)

          if (response?.data) {
            const processedGroups = methods.processGroups(response.data.list || [])
            set({
              groups: processedGroups,
              total: response.data.total || 0,
            })
          }
        }
        catch (error) {
          console.error('Failed to fetch groups:', error)
          toast.error('获取素材分组失败')
        }
        finally {
          set({ isLoading: false })
        }
      },

      /**
       * 创建分组
       */
      async createGroup(data: CreateGroupData): Promise<boolean> {
        set({ isSubmitting: true })

        try {
          await createMediaGroup(data)
          methods.closeCreateModal()
          // 重置到第一页并刷新
          set({ currentPage: 1 })
          await methods.fetchGroups()
          toast.success('创建成功')
          return true
        }
        catch (error) {
          console.error('Failed to create group:', error)
          toast.error('创建失败')
          return false
        }
        finally {
          set({ isSubmitting: false })
        }
      },

      /**
       * 更新分组
       */
      async updateGroup(id: string, data: UpdateGroupData): Promise<boolean> {
        set({ isSubmitting: true })

        try {
          await updateMediaGroupInfo(id, data)
          methods.closeCreateModal()
          await methods.fetchGroups()
          toast.success('更新成功')
          return true
        }
        catch (error) {
          console.error('Failed to update group:', error)
          toast.error('更新失败')
          return false
        }
        finally {
          set({ isSubmitting: false })
        }
      },

      /**
       * 删除分组
       */
      async deleteGroup(id: string): Promise<boolean> {
        set({ isDeleting: true })

        try {
          await deleteMediaGroup(id)
          // 如果当前页没有数据了，回退到上一页
          const { groups, currentPage } = get()
          if (groups.length === 1 && currentPage > 1) {
            set({ currentPage: currentPage - 1 })
          }
          await methods.fetchGroups()
          toast.success('删除成功')
          return true
        }
        catch (error) {
          console.error('Failed to delete group:', error)
          toast.error('删除失败')
          return false
        }
        finally {
          set({ isDeleting: false })
        }
      },

      /**
       * 获取默认分组（图片和视频）
       * 用于首页快捷入口
       */
      async fetchDefaultGroups() {
        try {
          // 获取分组列表（第一页足够获取默认分组）
          const response = await getMediaGroupList(1, 50)
          if (response?.data?.list) {
            const groups = response.data.list
            // 优先查找标记为默认的分组，否则取第一个对应类型的分组
            const defaultImg
              = groups.find(g => g.isDefault && g.type === 'img')
                || groups.find(g => g.type === 'img')
            const defaultVideo
              = groups.find(g => g.isDefault && g.type === 'video')
                || groups.find(g => g.type === 'video')
            set({
              defaultImgGroup: defaultImg || null,
              defaultVideoGroup: defaultVideo || null,
            })
          }
        }
        catch (error) {
          console.error('Failed to fetch default groups:', error)
        }
      },
    }

    return methods
  }),
)
