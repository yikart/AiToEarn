/**
 * useMediaUpload - 媒体文件上传 Hook
 * 功能：封装媒体文件上传逻辑，支持进度显示、中断上传、移除媒体
 * 复用场景：HomeChat、ChatDetailPage 等需要上传媒体的组件
 */

import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import { useCallback, useRef, useState } from 'react'
import { uploadToOss } from '@/api/oss'

export interface IUseMediaUploadOptions {
  /** 上传失败时的回调 */
  onError?: (error: Error) => void
}

export interface IUseMediaUploadReturn {
  /** 已上传的媒体列表 */
  medias: IUploadedMedia[]
  /** 设置媒体列表 */
  setMedias: React.Dispatch<React.SetStateAction<IUploadedMedia[]>>
  /** 是否正在上传 */
  isUploading: boolean
  /** 处理文件变更（上传） */
  handleMediasChange: (files: FileList) => Promise<void>
  /** 移除媒体 */
  handleMediaRemove: (index: number) => void
  /** 取消上传 */
  cancelUpload: () => void
  /** 清空所有媒体 */
  clearMedias: () => void
}

/**
 * useMediaUpload - 媒体文件上传 Hook
 * @param options 配置选项
 * @returns 媒体上传相关的状态和方法
 */
export function useMediaUpload(options?: IUseMediaUploadOptions): IUseMediaUploadReturn {
  const { onError } = options ?? {}

  // 状态
  const [medias, setMedias] = useState<IUploadedMedia[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // AbortController Map：按媒体 id 管理中断
  const uploadAbortRef = useRef<Map<string, AbortController> | null>(null)

  /**
   * 处理媒体文件上传
   * @param files 文件列表
   */
  const handleMediasChange = useCallback(
    async (files: FileList) => {
      if (!files.length)
        return

      setIsUploading(true)
      if (!uploadAbortRef.current) {
        uploadAbortRef.current = new Map()
      }

      const fileArray = Array.from(files)

      try {
        // 先批量添加占位媒体，记录每个媒体的 id
        const tempMedias: IUploadedMedia[] = fileArray.map((file) => {
          const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
          const isVideo = file.type.startsWith('video/')
          const isDocument = !file.type.startsWith('image/') && !file.type.startsWith('video/')
          return {
            id,
            url: '',
            type: isDocument ? 'document' : isVideo ? 'video' : 'image',
            progress: 0,
            file,
            name: isDocument ? file.name : undefined,
          }
        })

        setMedias(prev => [...prev, ...tempMedias])

        // 并行上传所有文件
        await Promise.all(
          fileArray.map(async (file, i) => {
            const targetId = tempMedias[i]?.id
            if (!targetId)
              return

            const controller = new AbortController()
            uploadAbortRef.current?.set(targetId, controller)

            const fullUrl = await uploadToOss(file, {
              onProgress: (progress) => {
                // 兼容 0-1 或 0-100 两种进度表示，统一成 0-100
                const percent = progress > 1 ? progress : progress * 100
                setMedias(prev =>
                  prev.map((m, idx) =>
                    m.id && m.id === targetId
                      ? { ...m, progress: Math.min(99, Math.max(0, percent)) }
                      : m,
                  ),
                )
              },
              signal: controller.signal,
            })

            setMedias(prev =>
              prev.map((m, idx) =>
                m.id && m.id === targetId
                  ? { ...m, url: fullUrl as string, progress: undefined }
                  : m,
              ),
            )

            uploadAbortRef.current?.delete(targetId)
          }),
        )
      }
      catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Upload failed:', error)
          onError?.(error)
        }
      }
      finally {
        setIsUploading(false)
        uploadAbortRef.current?.clear()
      }
    },
    [onError],
  )

  /**
   * 移除指定索引的媒体
   * @param index 媒体索引
   */
  const handleMediaRemove = useCallback((index: number) => {
    setMedias((prev) => {
      const target = prev[index]
      if (target?.id && uploadAbortRef.current?.has(target.id)) {
        uploadAbortRef.current.get(target.id)?.abort()
        uploadAbortRef.current.delete(target.id)
      }
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  /**
   * 取消当前上传
   */
  const cancelUpload = useCallback(() => {
    if (uploadAbortRef.current) {
      uploadAbortRef.current.forEach(controller => controller.abort())
      uploadAbortRef.current.clear()
    }
  }, [])

  /**
   * 清空所有媒体
   */
  const clearMedias = useCallback(() => {
    setMedias([])
  }, [])

  return {
    medias,
    setMedias,
    isUploading,
    handleMediasChange,
    handleMediaRemove,
    cancelUpload,
    clearMedias,
  }
}

export default useMediaUpload
