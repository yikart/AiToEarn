/**
 * media.ts - 媒体文件工具函数
 */

/** 获取视频文件时长（秒），通过临时 video 元素读取 metadata */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    const cleanup = () => {
      URL.revokeObjectURL(video.src)
      video.remove()
    }

    video.onloadedmetadata = () => {
      const duration = video.duration
      cleanup()
      resolve(Math.round(duration * 10) / 10)
    }

    video.onerror = () => {
      cleanup()
      reject(new Error('Failed to load video metadata'))
    }

    video.src = URL.createObjectURL(file)
  })
}

/** 获取视频元信息：时长 + 宽高 */
export function getVideoMeta(file: File): Promise<{ duration: number, width: number, height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const cleanup = () => { URL.revokeObjectURL(video.src); video.remove() }
    video.onloadedmetadata = () => {
      resolve({
        duration: Math.round(video.duration * 10) / 10,
        width: video.videoWidth,
        height: video.videoHeight,
      })
      cleanup()
    }
    video.onerror = () => { cleanup(); reject(new Error('Failed to load video metadata')) }
    video.src = URL.createObjectURL(file)
  })
}

/** 从本地视频文件提取封面（data URL）和时长 */
export function getVideoInfo(file: File): Promise<{ coverUrl: string, duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'auto'
    const blobUrl = URL.createObjectURL(file)
    video.src = blobUrl

    const cleanup = () => {
      URL.revokeObjectURL(blobUrl)
      video.remove()
    }

    video.onloadedmetadata = () => {
      video.currentTime = 0.1
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      const coverUrl = canvas.toDataURL('image/jpeg', 0.7)
      const duration = Math.round(video.duration * 10) / 10
      cleanup()
      resolve({ coverUrl, duration })
    }

    video.onerror = () => {
      cleanup()
      reject(new Error('Failed to load video'))
    }
  })
}

/** 格式化视频时长为 M:SS */
export function formatVideoDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
