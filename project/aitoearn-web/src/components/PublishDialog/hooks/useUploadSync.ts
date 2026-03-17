/**
 * 上传结果同步 Hook
 * 处理上传任务完成后同步 ossUrl 到发布参数
 */

import type {
  UploadCacheItem,
  UploadTask,
} from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload.type'
import type { PubItem } from '@/components/PublishDialog/publishDialog.type'

import { useEffect } from 'react'

interface UseUploadSyncParams {
  pubListChoosed: PubItem[]
  tasks: Record<string, UploadTask>
  md5Cache: Record<string, UploadCacheItem>
  setPubListChoosed: (list: PubItem[]) => void
}

/**
 * 上传结果同步 Hook
 * 监听上传任务完成，将 ossUrl 同步到发布参数中
 */
export function useUploadSync({
  pubListChoosed,
  tasks,
  md5Cache,
  setPubListChoosed,
}: UseUploadSyncParams) {
  useEffect(() => {
    // 如果没有选中的账号，直接返回
    if (pubListChoosed.length === 0) {
      return
    }

    let hasChanges = false

    const newPubList = pubListChoosed.map((v) => {
      const video = v.params.video
      const images = v.params.images
      let itemChanged = false
      let newVideo = video
      let newImages = images

      // 视频匹配
      if (video) {
        // 如果视频本身没有ossUrl，从上传任务中获取
        if (!video.ossUrl && video.uploadTaskIds?.video) {
          const task = tasks[video.uploadTaskIds.video]
          if (task?.md5 && md5Cache[task.md5]?.ossUrl) {
            itemChanged = true
            hasChanges = true
            newVideo = {
              ...video,
              ossUrl: md5Cache[task.md5].ossUrl,
            }
          }
        }

        // 如果封面没有ossUrl，从上传任务中获取
        if (newVideo && !newVideo.cover?.ossUrl && video.uploadTaskIds?.cover) {
          const task = tasks[video.uploadTaskIds.cover]
          if (task?.md5 && md5Cache[task.md5]?.ossUrl) {
            itemChanged = true
            hasChanges = true
            newVideo = {
              ...newVideo,
              cover: {
                ...newVideo.cover,
                ossUrl: md5Cache[task.md5].ossUrl,
              },
            }
          }
        }
      }

      // 图片匹配
      if (images && images.length > 0) {
        let imagesChanged = false
        newImages = images.map((img) => {
          // 只有当图片没有ossUrl且有uploadTaskId时，才从上传任务中获取
          // AI生成的图片已经有ossUrl，不需要从上传任务获取
          if (!img.ossUrl && img.uploadTaskId && tasks[img.uploadTaskId]) {
            const taskMd5 = tasks[img.uploadTaskId].md5
            if (taskMd5 && md5Cache[taskMd5]?.ossUrl) {
              imagesChanged = true
              return { ...img, ossUrl: md5Cache[taskMd5].ossUrl }
            }
          }
          return img
        })

        if (imagesChanged) {
          itemChanged = true
          hasChanges = true
        }
        else {
          // 如果图片没有变化，保持原引用
          newImages = images
        }
      }

      // 只有当该项有变化时才创建新对象
      if (itemChanged) {
        return {
          ...v,
          params: {
            ...v.params,
            video: newVideo,
            images: newImages,
          },
        }
      }

      return v
    })

    // 只有在数据真正变化时才更新 state
    if (hasChanges) {
      setPubListChoosed(newPubList)
    }
  }, [pubListChoosed, md5Cache, tasks, setPubListChoosed])
}
