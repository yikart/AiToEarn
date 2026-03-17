/**
 * 公开推广码 API
 * 用于推广者侧获取素材信息
 */

import type { OptimalMaterialVo } from '../types/open/promotionCode'
import type { PlatType } from '@/app/config/platConfig'
import http from '@/utils/request'

/**
 * 通过素材组ID获取最优素材（公开接口，无需认证）
 * @param groupId 素材组ID（即推广码）
 * @param accountType 平台类型，用于筛选匹配的素材
 */
export function apiGetOptimalMaterial(groupId: string, accountType: PlatType) {
  return http.get<OptimalMaterialVo>('/material/optimal', { groupId, accountType })
}

/**
 * 创建公开发布记录（公开接口，无需认证）
 * 用于推广者提交作品链接
 */
export function apiCreateOpenPublishRecord(params: {
  materialGroupId: string
  materialId?: string
  workLink: string
  accountType: PlatType
  videoUrl?: string
  coverUrl?: string
  imgUrlList?: string[]
  title?: string
  desc?: string
  topics?: string[]
}) {
  return http.post<{ id: string, success: boolean }>('/task/open/publish-record/create', params)
}
