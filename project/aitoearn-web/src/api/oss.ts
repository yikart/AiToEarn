import md5 from 'blueimp-md5'
import { useUserStore } from '@/store/user'
import { request } from '@/utils/request'

/**
 * 资源类型
 */
export enum AssetType {
  AgentSession = 'agentSession',
  AiCard = 'aiCard',
  AiChatImage = 'aiChatImage',
  AiImage = 'aiImage',
  AiVideo = 'aiVideo',
  AideoOutput = 'aideoOutput',
  Avatar = 'avatar',
  DramaRecap = 'dramaRecap',
  StyleTransfer = 'styleTransfer',
  Temp = 'temp',
  UserFile = 'userFile',
  UserMedia = 'userMedia',
  VideoEdit = 'videoEdit',
}

export interface UploadToOssOptions {
  onProgress?: (prog: number) => void
  signal?: AbortSignal
}

// 获取 R2 presigned post 数据
async function getPresignedPostData(fileName: string, fileSize: number, contentType: string) {
  // 根据文件类型判断资源类型
  let type = AssetType.UserFile // 默认类型

  if (contentType.startsWith('image/')) {
    type = AssetType.UserMedia
  }
  else if (contentType.startsWith('video/')) {
    type = AssetType.UserMedia
  }
  else if (contentType.includes('avatar') || fileName.includes('avatar')) {
    type = AssetType.Avatar
  }

  const res: any = await request({
    url: 'assets/uploadSign',
    method: 'POST',
    data: {
      filename: fileName,
      size: fileSize,
      type,
    },
  })

  if (res.code !== 0) {
    throw new Error('获取上传签名失败')
  }

  return res.data
}

// 上传文件到OSS (前端直传 AWS S3)
export async function uploadToOss(
  file: File | Blob,
  options?: UploadToOssOptions | ((prog: number) => void),
) {
  try {
    const opts: UploadToOssOptions
      = typeof options === 'function' ? { onProgress: options } : (options ?? {})

    if (opts.signal?.aborted) {
      throw new DOMException('上传已取消', 'AbortError')
    }

    // 获取文件信息
    const originalFileName = (file as any).name || `file_${Date.now()}`

    // 检查文件名是否包含中文
    const hasChinese = /[\u4E00-\u9FA5]/.test(originalFileName)

    // 获取文件扩展名
    const fileExtension = originalFileName.includes('.')
      ? originalFileName.substring(originalFileName.lastIndexOf('.'))
      : ''

    // 如果包含中文，对文件名进行MD5处理；否则使用原文件名
    const processedFileName = hasChinese
      ? md5(originalFileName.replace(fileExtension, '')) + fileExtension
      : originalFileName

    const fileName = `${useUserStore.getState().userInfo?.id}/${md5(
      new Date().getTime().toString(),
    )}${processedFileName}`
    const fileSize = file.size
    const contentType = file.type || 'application/octet-stream'

    // 获取 presigned post 数据
    const presignedData = await getPresignedPostData(fileName, fileSize, contentType)

    // R2 使用 PUT 请求直接上传到 uploadUrl，不需要 FormData
    const uploadUrl = presignedData.uploadUrl

    // 直传文件到 AWS S3 (支持进度回调)
    if (opts.onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // 监听上传进度
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            opts.onProgress?.(progress)
          }
        })

        const handleAbort = () => {
          xhr.abort()
          reject(new DOMException('上传失败: 用户取消', 'AbortError'))
        }

        opts.signal?.addEventListener('abort', handleAbort, { once: true })

        // 监听上传完成
        xhr.addEventListener('load', async () => {
          opts.signal?.removeEventListener('abort', handleAbort)
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              // 上传成功后确认资产
              const confirmResponse: any = await request({
                url: `assets/${presignedData.id}/confirm`,
                method: 'POST',
                data: {
                  id: presignedData.id,
                },
              })

              // 返回确认接口返回的最终访问URL
              resolve(confirmResponse?.data?.url || presignedData.url)
            }
            catch (confirmError) {
              console.error('确认上传失败:', confirmError)
              reject(new Error('上传确认失败'))
            }
          }
          else {
            reject(new Error(`上传失败: ${xhr.statusText}`))
          }
        })

        // 监听上传错误
        xhr.addEventListener('error', () => {
          opts.signal?.removeEventListener('abort', handleAbort)
          reject(new Error('上传失败: 网络错误'))
        })

        // 开始上传 (R2 使用 PUT 请求)
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', contentType)
        xhr.send(file)
      })
    }
    else {
      // 不使用进度回调的简单版本 (R2 使用 PUT 请求)
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
        },
        signal: opts.signal,
      })

      if (!uploadResponse.ok) {
        throw new Error(`上传失败: ${uploadResponse.statusText}`)
      }

      // 上传成功后确认资产
      const confirmResponse: any = await request({
        url: `assets/${presignedData.id}/confirm`,
        method: 'POST',
        data: {
          id: presignedData.id,
        },
      })

      // 返回确认接口返回的最终访问URL
      return confirmResponse?.data?.url || presignedData.url
    }
  }
  catch (error) {
    console.error('上传文件失败:', error)
    throw error
  }
}
