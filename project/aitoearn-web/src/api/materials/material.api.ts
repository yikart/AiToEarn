import type { ConfirmUploadData, CreateMaterialGroupParams, CreateMaterialGroupVo, CreateMaterialParams, GetMaterialGroupBySceneParams, MaterialFilterDeleteParams, MaterialGroupBySceneData, MaterialGroupListFilters, MaterialGroupListVo, MaterialGroupSceneVo, MaterialListFilters, MaterialListQueryParams, MaterialListVo, MaterialOpenApiResponse, MediaListFilters, MediaListResponse, OptimalMaterialVo, PromotionMaterial, ThumbnailVo, TransferMaterialParams, TransferMediaParams, TransferMediaResult, UpdateMaterialGroupParams, UpdateMaterialParams, UploadSignData, UploadToOssOptions } from './material.types'
import type { PlatType } from '@/app/config/platConfig'
import md5 from 'blueimp-md5'
import { useUserStore } from '@/store/user'
import { optimizeImageForUpload } from '@/utils/media'
import http, { request } from '@/utils/request'
import { AssetType } from './material.constants'

// Source: assets.ts
/**
 * Get Video Thumbnail
 * Get or extract thumbnail from a video by URL. If thumbnail already exists in metadata.cover, returns it directly. Otherwise extracts a new thumbnail.
 */
export function getVideoThumbnail(url: string, timeInSeconds = 1) {
  return http.get<ThumbnailVo>('assets/thumbnail', { url, timeInSeconds })
}

// Source: oss.ts
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

/**
 * 上传文件到OSS (前端直传 AWS S3)
 */
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

    const uploadFile = await optimizeImageForUpload(file, { signal: opts.signal })

    const fileName = getUploadFileName(uploadFile, opts.publicUploadId)

    const fileSize = uploadFile.size
    const contentType = uploadFile.type || 'application/octet-stream'

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
        xhr.send(uploadFile)
      })
    }
    else {
      // 不使用进度回调的简单版本 (R2 使用 PUT 请求)

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: uploadFile,
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

/**
 * 批量删除媒体资源
 * 根据ID列表批量删除媒体资源。
 */
export function batchDeleteMedia(ids: string[]) {
  return http.delete('media/ids', { ids })
}

/**
 * 媒体资源转移到其他分组
 * 将媒体资源移动或复制到目标媒体分组。move 模式直接移动，copy 模式复制并重置使用次数。
 */
export function transferMedia(data: TransferMediaParams) {
  return http.post<TransferMediaResult>('media/transfer', data)
}

/**
 * 获取媒体资源列表
 * 分页获取媒体资源列表。
 */
export function getMediaList(
  filter: MediaListFilters,
  pageNo: number,
  pageSize: number,
  type?: 'video' | 'img',
) {
  return http.get<MediaListResponse>(`media/list/${pageNo}/${pageSize}`, {
    ...filter,
    ...(type ? { type } : {}),
  })
}

// Source: material.ts
/**
 * 创建草稿分组
 * 使用提供的元数据创建新的草稿分组。
 */
export function apiCreateMaterialGroup(data: CreateMaterialGroupParams) {
  return http.post<CreateMaterialGroupVo>('material/group', {
    ...data,
    type: 'video',
  })
}

/**
 * 删除草稿分组
 * 根据ID删除草稿分组。
 */
export function apiDeleteMaterialGroup(id: string) {
  return http.delete(`material/group/${id}`)
}

/**
 * 更新草稿分组信息
 * 更新草稿分组的详情。
 */
export function apiUpdateMaterialGroupInfo(
  id: string,
  data: UpdateMaterialGroupParams,
) {
  return http.post(`material/group/info/${id}`, data)
}

/**
 * 获取草稿分组列表
 * 分页获取草稿分组列表，包含关联的店铺信息。
 */
export function apiGetMaterialGroupList(pageNo: number, pageSize: number, filters?: MaterialGroupListFilters) {
  return http.get<MaterialGroupListVo>(`material/group/list/${pageNo}/${pageSize}`, filters)
}

/**
 * 获取草稿分组详情
 * 根据ID获取草稿分组详情。
 */
export function apiGetMaterialInfo(id: string) {
  return http.get(`material/group/info/${id}`)
}

/**
 * 创建草稿
 * 使用提供的媒体和元数据创建草稿。
 */
export function apiCreateMaterial(
  data: CreateMaterialParams,
  silent?: boolean,
) {
  return http.post('material', data, silent)
}

/**
 * 删除草稿
 * 根据ID删除草稿。
 */
export function apiDeleteMaterial(id: string) {
  return http.delete(`material/${id}`)
}

/**
 * 批量删除草稿
 * 根据ID列表批量删除草稿。
 */
export function apiBatchDeleteMaterials(ids: string[]) {
  return http.delete('material/list', { ids })
}

/**
 * 草稿转移到其他草稿箱
 * 将草稿移动或复制到目标草稿箱。move 模式直接移动，copy 模式复制并重置使用次数。
 */
export function apiTransferMaterials(data: TransferMaterialParams) {
  return http.post<TransferMediaResult>('material/transfer', data)
}

/**
 * 按条件删除草稿
 * 删除符合筛选条件的草稿。
 */
export function apiFilterDeleteMaterials(data: MaterialFilterDeleteParams) {
  return http.delete('material/filter', data)
}

/**
 * 获取草稿列表
 * 分页获取草稿列表，支持筛选条件。
 */
export async function apiGetMaterialList(groupId: string, pageNo: number, pageSize: number, filters?: MaterialListFilters) {
  const params: MaterialListQueryParams = { groupId }
  if (filters?.title)
    params.title = filters.title
  if (filters?.useCount !== undefined)
    params.useCount = filters.useCount
  const res = await http.get<MaterialListVo>(`material/list/${pageNo}/${pageSize}`, params)

  const list = res?.data?.list
  // 兼容代码，图文草稿补封面
  if (list && list.length > 0) {
    list.map((item) => {
      if (item.mediaList[0].type === 'img') {
        item.coverUrl = item.mediaList[0].url
      }
    })
  }
  return res
}

/**
 * 获取草稿详情
 * 根据ID获取草稿详情。
 */
export function apiGetDraftInfo(id: string) {
  return http.get<PromotionMaterial>(`material/info/${id}`)
}

/**
 * 更新草稿信息
 * 根据ID更新草稿详情。
 */
export function apiUpdateMaterial(
  id: string,
  data: UpdateMaterialParams,
) {
  return http.put(`material/info/${id}`, data)
}

/**
 * 通过素材组ID获取最优素材（公开接口，无需认证）
 * @param groupId 素材组ID（即推广码）
 * @param accountType 平台类型，用于筛选匹配的素材
 */
export function apiGetOptimalMaterial(groupId: string, accountType: PlatType) {
  return http.get<OptimalMaterialVo>('/material/optimal', { groupId, accountType })
}

/**
 * 按使用场景查询素材组
 * 公开接口，用于按使用场景与关联 ID 解析第一个素材组。
 */
export async function apiGetMaterialGroupByScene(
  params: GetMaterialGroupBySceneParams,
  silent?: boolean,
): Promise<MaterialOpenApiResponse<MaterialGroupSceneVo | null>> {
  const res = await http.get<MaterialGroupBySceneData>('/material/group/by-scene', params, silent)
  if (!res)
    return res

  return {
    ...res,
    data: Array.isArray(res.data) ? res.data[0] ?? null : res.data,
  }
}
