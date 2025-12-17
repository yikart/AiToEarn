/**
 * useMediaUpload - 媒体文件上传 Hook
 * 功能：封装媒体文件上传逻辑，支持进度显示、中断上传、移除媒体
 * 复用场景：HomeChat、ChatDetailPage 等需要上传媒体的组件
 */

import { useRef, useState, useCallback } from 'react'
import { uploadToOss } from '@/api/oss'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'

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

  // AbortController 用于取消上传
  const uploadAbortRef = useRef<AbortController | null>(null)

  /**
   * 处理媒体文件上传
   * @param files 文件列表
   */
  const handleMediasChange = useCallback(
    async (files: FileList) => {
      if (!files.length) return

      setIsUploading(true)
      uploadAbortRef.current = new AbortController()

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const isVideo = file.type.startsWith('video/')
          const isDocument = !file.type.startsWith('image/') && !file.type.startsWith('video/')

          // 计算当前媒体在列表中的索引
          const mediaIndex = medias.length + i

          // 添加到列表，显示上传进度
          const tempMedia: IUploadedMedia = {
            url: '',
            type: isDocument ? 'document' : isVideo ? 'video' : 'image',
            progress: 0,
            file,
            name: isDocument ? file.name : undefined,
          }
          setMedias((prev) => [...prev, tempMedia])

          // 上传文件（uploadToOss 返回全路径 URL）
          const fullUrl = await uploadToOss(file, {
            onProgress: (progress) => {
              setMedias((prev) =>
                prev.map((m, idx) => (idx === mediaIndex ? { ...m, progress } : m)),
              )
            },
            signal: uploadAbortRef.current?.signal,
          })

          // 上传完成，更新 URL 并移除进度
          setMedias((prev) =>
            prev.map((m, idx) =>
              idx === mediaIndex ? { ...m, url: fullUrl as string, progress: undefined } : m,
            ),
          )
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Upload failed:', error)
          onError?.(error)
        }
      } finally {
        setIsUploading(false)
        uploadAbortRef.current = null
      }
    },
    [medias.length, onError],
  )

  /**
   * 移除指定索引的媒体
   * @param index 媒体索引
   */
  const handleMediaRemove = useCallback((index: number) => {
    setMedias((prev) => prev.filter((_, i) => i !== index))
  }, [])

  /**
   * 取消当前上传
   */
  const cancelUpload = useCallback(() => {
    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort()
      uploadAbortRef.current = null
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

