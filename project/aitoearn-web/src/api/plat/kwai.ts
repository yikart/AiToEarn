import type { GetKwaiAuthStatusRes } from '@/api/plat/types/kwai.types'
import { useUserStore } from '@/store'
import http from '@/utils/request'

export interface KwaiNoUserAuthUrlParams {
  promotionCode: string
}

/**
 * 创建快手授权
 * @param type 授权类型
 * @param spaceId 空间ID（可选）
 * @returns 快手授权地址与任务 ID
 */
export function createKwaiAuth(type: 'h5' | 'pc', spaceId?: string) {
  const data = {
    type,
    spaceId: spaceId || '-',
    userId: useUserStore.getState().userInfo?.id,
  }
  return http.get<{
    url: string
    taskId: string
  }>(`plat/kwai/auth/url/${type}`, data)
}

export function apiGetKwaiNoUserAuthUrl(params: KwaiNoUserAuthUrlParams) {
  return http.post<{ url: string, state: string }>('plat/kwai/authUrl', params)
}

// 获取账号授权状态
export function getKwaiAuthStatus(taskId: string) {
  return http.post<GetKwaiAuthStatusRes>(`plat/kwai/auth/create-account/${taskId}`)
}
