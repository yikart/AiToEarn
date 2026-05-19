import type { ConfirmUploadData, UploadSignData, UploadToOssOptions } from '@/api/types/oss'
import md5 from 'blueimp-md5'
import { AssetType } from '@/api/types/oss'
import { useUserStore } from '@/store/user'
import { request } from '@/utils/request'

export { AssetType }
export type { UploadToOssOptions }

function getOriginalFileName(file: File | Blob) {
  return 'name' in file && typeof file.name === 'string' && file.name
    ? file.name
    : `file_${Date.now()}`
}

function getUploadRequestPath(publicUploadId?: string) {
  return publicUploadId
    ? `assets/public/${encodeURIComponent(publicUploadId)}/uploadSign`
    : 'assets/uploadSign'
}

function getConfirmRequestPath(assetId: string, publicUploadId?: string) {
  return publicUploadId
    ? `assets/public/${encodeURIComponent(publicUploadId)}/${assetId}/confirm`
    : `assets/${assetId}/confirm`
}

function getAssetType(fileName: string, contentType: string) {
  if (contentType.startsWith('image/') || contentType.startsWith('video/'))
    return AssetType.UserMedia

  if (contentType.includes('avatar') || fileName.includes('avatar'))
    return AssetType.Avatar

  return AssetType.UserFile
}

function getUploadFileName(file: File | Blob, publicUploadId?: string) {
  const originalFileName = getOriginalFileName(file)
  const hasChinese = /[\u4E00-\u9FA5]/.test(originalFileName)
  const fileExtension = originalFileName.includes('.')
    ? originalFileName.substring(originalFileName.lastIndexOf('.'))
    : ''
  const processedFileName = hasChinese
    ? md5(originalFileName.replace(fileExtension, '')) + fileExtension
    : originalFileName
  const ownerId = publicUploadId || useUserStore.getState().userInfo?.id
  const hashedPrefix = md5(new Date().getTime().toString())

  return ownerId
    ? `${ownerId}/${hashedPrefix}${processedFileName}`
    : `${hashedPrefix}${processedFileName}`
}

// 获取 R2 presigned post 数据
async function getPresignedPostData(fileName: string, fileSize: number, contentType: string, publicUploadId?: string) {
  const res = await request<UploadSignData>({
    url: getUploadRequestPath(publicUploadId),
    method: 'POST',
    data: {
      filename: fileName,
      size: fileSize,
      type: getAssetType(fileName, contentType),
    },
  })

  if (!res || res.code !== 0)
    throw new Error(res?.message || '获取上传签名失败')

  return res.data
}

async function confirmUpload(assetId: string, fallbackUrl: string, publicUploadId?: string) {
  const confirmResponse = await request<ConfirmUploadData>({
    url: getConfirmRequestPath(assetId, publicUploadId),
    method: 'POST',
    data: {
      id: assetId,
    },
  })

  if (!confirmResponse || confirmResponse.code !== 0)
    throw new Error(confirmResponse?.message || '上传确认失败')

  return confirmResponse.data?.url || fallbackUrl
}

// 上传文件到OSS (前端直传 AWS S3)
export async function uploadToOss(
  file: File | Blob,
  options?: UploadToOssOptions | ((prog: number) => void),
): Promise<string> {
  try {
    const opts: UploadToOssOptions
      = typeof options === 'function' ? { onProgress: options } : (options ?? {})

    if (opts.signal?.aborted) {
      throw new DOMException('上传已取消', 'AbortError')
    }

    const fileName = getUploadFileName(file, opts.publicUploadId)
    const fileSize = file.size
    const contentType = file.type || 'application/octet-stream'

    // 获取 presigned post 数据
    const presignedData = await getPresignedPostData(fileName, fileSize, contentType, opts.publicUploadId)

    // R2 使用 PUT 请求直接上传到 uploadUrl，不需要 FormData
    const uploadUrl = presignedData.uploadUrl

    // 直传文件到 AWS S3 (支持进度回调)
    if (opts.onProgress) {
      return new Promise<string>((resolve, reject) => {
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
              // 返回确认接口返回的最终访问URL
              resolve(await confirmUpload(presignedData.id, presignedData.url, opts.publicUploadId))
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

      // 返回确认接口返回的最终访问URL
      return confirmUpload(presignedData.id, presignedData.url, opts.publicUploadId)
    }
  }
  catch (error) {
    console.error('上传文件失败:', error)
    throw error
  }
}
