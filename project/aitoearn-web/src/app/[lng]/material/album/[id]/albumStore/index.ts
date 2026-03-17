/**
 * albumStore - 相册详情页状态管理
 * 管理媒体资源的 CRUD 操作和 UI 状态
 */

import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { createMedia, deleteMedia, getMediaList } from '@/api/media'
import { uploadToOss } from '@/api/oss'
import { VideoGrabFrame } from '@/components/PublishDialog/PublishDialog.util'
import { toast } from '@/lib/toast'
import { getOssUrl } from '@/utils/oss'

/**
 * 媒体资源类型
 */
export interface Media {
  _id: string
  name: string
  url: string
  /** 缩略图 URL（视频封面/图片缩略图） */
  thumbUrl: string
  type: 'video' | 'img'
  title: string
  desc: string
  /** 创建时间 */
  createdAt: string
}

/**
 * 上传任务类型
 */
export interface UploadTask {
  /** 任务唯一标识 */
  id: string
  /** 文件对象 */
  file: File
  /** 文件名 */
  fileName: string
  /** 上传进度 0-100 */
  progress: number
  /** 任务状态 */
  status: 'pending' | 'uploading' | 'success' | 'error'
  /** 错误信息 */
  error?: string
}

/**
 * 分组信息类型
 */
export interface GroupInfo {
  _id: string
  title: string
  type: 'video' | 'img'
  desc: string
}

/**
 * albumStore 状态类型
 */
export interface IAlbumStore {
  // 分组信息
  groupInfo: GroupInfo | null

  // 媒体列表
  mediaList: Media[]
  total: number

  // 状态
  isLoading: boolean
  isUploading: boolean
  isDeleting: boolean
  /** 是否正在加载更多 */
  isLoadingMore: boolean

  // 分页（无限滚动模式）
  currentPage: number
  pageSize: number
  /** 是否还有更多数据 */
  hasMore: boolean

  // 上传队列
  uploadQueue: UploadTask[]

  // 预览
  previewOpen: boolean
  previewIndex: number
}

/**
 * 初始状态
 */
const initialState: IAlbumStore = {
  groupInfo: null,
  mediaList: [],
  total: 0,
  isLoading: false,
  isUploading: false,
  isDeleting: false,
  isLoadingMore: false,
  currentPage: 1,
  pageSize: 20,
  hasMore: true,
  uploadQueue: [],
  previewOpen: false,
  previewIndex: 0,
}

/**
 * 获取初始状态的深拷贝
 */
function getInitialState(): IAlbumStore {
  return lodash.cloneDeep(initialState)
}

/**
 * 相册详情 Store
 */
export const useAlbumStore = create(
  combine({ ...getInitialState() }, (set, get) => {
    const methods = {
      /**
       * 重置 Store 到初始状态
       */
      reset() {
        set(getInitialState())
      },

      /**
       * 设置分组信息
       */
      setGroupInfo(groupInfo: GroupInfo) {
        set({ groupInfo })
      },

      /**
       * 设置当前页码并重新加载
       */
      setCurrentPage(page: number) {
        set({ currentPage: page })
      },

      /**
       * 打开预览
       */
      openPreview(index: number) {
        set({ previewOpen: true, previewIndex: index })
      },

      /**
       * 关闭预览
       */
      closePreview() {
        set({ previewOpen: false })
      },

      /**
       * 获取媒体列表（首次加载，重置列表）
       */
      async fetchMediaList(groupId: string) {
        set({ isLoading: true, currentPage: 1, hasMore: true })

        try {
          const response: any = await getMediaList(groupId, 1, get().pageSize)

          if (response?.data?.list) {
            const list = response.data.list
            const total = response.data.total || 0
            set({
              mediaList: list,
              total,
              hasMore: list.length < total,
            })
          }
          else {
            set({ mediaList: [], total: 0, hasMore: false })
          }
        }
        catch (error) {
          console.error('Failed to fetch media list:', error)
          toast.error('获取媒体资源列表失败')
          set({ mediaList: [], total: 0, hasMore: false })
        }
        finally {
          set({ isLoading: false })
        }
      },

      /**
       * 加载更多（无限滚动）
       */
      async loadMore(groupId: string) {
        const { isLoadingMore, hasMore, currentPage, pageSize, mediaList } = get()
        if (isLoadingMore || !hasMore)
          return

        const nextPage = currentPage + 1
        set({ isLoadingMore: true })

        try {
          const response: any = await getMediaList(groupId, nextPage, pageSize)

          if (response?.data?.list) {
            const newList = response.data.list
            const total = response.data.total || 0
            const combinedList = [...mediaList, ...newList]

            set({
              mediaList: combinedList,
              total,
              currentPage: nextPage,
              hasMore: combinedList.length < total,
            })
          }
          else {
            set({ hasMore: false })
          }
        }
        catch (error) {
          console.error('Failed to load more media:', error)
          toast.error('加载更多失败')
        }
        finally {
          set({ isLoadingMore: false })
        }
      },

      /**
       * 根据资源组类型获取允许的文件类型
       */
      getAcceptTypes(): string {
        const { groupInfo } = get()
        if (!groupInfo)
          return 'image/*,video/*'

        switch (groupInfo.type) {
          case 'video':
            return 'video/*'
          case 'img':
            return 'image/*'
          default:
            return 'image/*,video/*'
        }
      },

      /**
       * 验证文件类型是否匹配资源组类型
       */
      validateFileType(file: File): boolean {
        const { groupInfo } = get()
        if (!groupInfo)
          return true

        const fileType = file.type
        switch (groupInfo.type) {
          case 'video':
            return fileType.startsWith('video/')
          case 'img':
            return fileType.startsWith('image/')
          default:
            return true
        }
      },

      /**
       * 上传媒体资源（单个文件，带进度）
       */
      async uploadMedia(groupId: string, file: File): Promise<boolean> {
        const { groupInfo } = get()

        // 验证文件类型
        if (!methods.validateFileType(file)) {
          const typeMap = {
            video: '视频',
            img: '图片',
          }
          toast.error(`此资源组只允许上传${typeMap[groupInfo!.type]}文件`)
          return false
        }

        set({ isUploading: true })

        try {
          // 上传文件到 OSS
          const url = await uploadToOss(file)

          // 获取缩略图
          let thumbUrl: string
          if (file.type.startsWith('video/')) {
            // 视频：提取第一帧作为封面
            const res = await VideoGrabFrame(URL.createObjectURL(file), 0)
            const blob = res.cover.file
            const fileName = `${file.name.replace(/\.[^/.]+$/, '')}_cover.png`
            const coverFile = new File([blob], fileName, {
              type: blob.type || 'image/png',
            })
            thumbUrl = await uploadToOss(coverFile)
          }
          else {
            // 图片：使用原图作为缩略图
            thumbUrl = url
          }

          // 创建媒体资源
          await createMedia({
            groupId,
            type: file.type.startsWith('video/') ? 'video' : 'img',
            url,
            title: file.name,
            desc: '',
            thumbUrl,
          })

          toast.success('上传成功')
          await methods.fetchMediaList(groupId)
          return true
        }
        catch (error) {
          console.error('Failed to upload media:', error)
          toast.error('上传失败')
          return false
        }
        finally {
          set({ isUploading: false })
        }
      },

      /**
       * 批量上传媒体资源
       */
      async uploadMultipleMedia(groupId: string, files: File[]) {
        const { groupInfo } = get()

        // 过滤不符合类型的文件
        const validFiles = files.filter((file) => {
          if (!methods.validateFileType(file)) {
            const typeMap = { video: '视频', img: '图片' }
            toast.error(`${file.name} 不是${typeMap[groupInfo!.type]}文件，已跳过`)
            return false
          }
          return true
        })

        if (validFiles.length === 0)
          return

        // 创建上传任务
        const tasks: UploadTask[] = validFiles.map(file => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          fileName: file.name,
          progress: 0,
          status: 'pending' as const,
        }))

        // 添加到上传队列
        set(state => ({
          uploadQueue: [...state.uploadQueue, ...tasks],
          isUploading: true,
        }))

        // 逐个上传
        for (const task of tasks) {
          // 更新状态为上传中
          set(state => ({
            uploadQueue: state.uploadQueue.map(t =>
              t.id === task.id ? { ...t, status: 'uploading' as const } : t,
            ),
          }))

          try {
            // 上传文件到 OSS（带进度回调）
            const url = await uploadToOss(task.file, {
              onProgress: (percent: number) => {
                set(state => ({
                  uploadQueue: state.uploadQueue.map(t =>
                    t.id === task.id ? { ...t, progress: Math.round(percent) } : t,
                  ),
                }))
              },
            })

            // 获取缩略图
            let thumbUrl: string
            if (task.file.type.startsWith('video/')) {
              const res = await VideoGrabFrame(URL.createObjectURL(task.file), 0)
              const blob = res.cover.file
              const fileName = `${task.file.name.replace(/\.[^/.]+$/, '')}_cover.png`
              const coverFile = new File([blob], fileName, {
                type: blob.type || 'image/png',
              })
              thumbUrl = await uploadToOss(coverFile)
            }
            else {
              thumbUrl = url
            }

            // 创建媒体资源
            await createMedia({
              groupId,
              type: task.file.type.startsWith('video/') ? 'video' : 'img',
              url,
              title: task.file.name,
              desc: '',
              thumbUrl,
            })

            // 更新状态为成功
            set(state => ({
              uploadQueue: state.uploadQueue.map(t =>
                t.id === task.id ? { ...t, status: 'success' as const, progress: 100 } : t,
              ),
            }))
          }
          catch (error) {
            console.error('Failed to upload file:', task.fileName, error)
            // 更新状态为失败
            set(state => ({
              uploadQueue: state.uploadQueue.map(t =>
                t.id === task.id ? { ...t, status: 'error' as const, error: '上传失败' } : t,
              ),
            }))
          }
        }

        // 刷新列表
        await methods.fetchMediaList(groupId)
        set({ isUploading: false })

        // 3秒后清理已完成的任务
        setTimeout(() => {
          set(state => ({
            uploadQueue: state.uploadQueue.filter(t => t.status !== 'success'),
          }))
        }, 3000)
      },

      /**
       * 取消上传任务
       */
      cancelUpload(taskId: string) {
        set(state => ({
          uploadQueue: state.uploadQueue.filter(t => t.id !== taskId),
        }))
      },

      /**
       * 清空已完成的上传任务
       */
      clearCompletedUploads() {
        set(state => ({
          uploadQueue: state.uploadQueue.filter(
            t => t.status !== 'success' && t.status !== 'error',
          ),
        }))
      },

      /**
       * 删除媒体资源（本地移除，适配无限滚动）
       */
      async deleteMedia(_groupId: string, mediaId: string): Promise<boolean> {
        set({ isDeleting: true })

        try {
          await deleteMedia(mediaId)

          // 本地移除该项，不重新加载
          set(state => ({
            mediaList: state.mediaList.filter(m => m._id !== mediaId),
            total: Math.max(0, state.total - 1),
          }))

          toast.success('删除成功')
          return true
        }
        catch (error) {
          console.error('Failed to delete media:', error)
          toast.error('删除失败')
          return false
        }
        finally {
          set({ isDeleting: false })
        }
      },

      /**
       * 获取预览项列表（用于 MediaPreview 组件）
       */
      getPreviewItems() {
        const { mediaList } = get()
        return mediaList.map(media => ({
          type: media.type === 'video' ? 'video' : 'image',
          src: getOssUrl(media.url),
          title: media.title,
        })) as Array<{ type: 'image' | 'video', src: string, title?: string }>
      },
    }

    return methods
  }),
)
