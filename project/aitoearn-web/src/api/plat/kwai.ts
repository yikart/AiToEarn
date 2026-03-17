import type { GetKwaiAuthStatusRes } from '@/api/plat/types/kwai.types'
import { useUserStore } from '@/store'
import http from '@/utils/request'

/**
 * 创建快手授权
 * @param type 授权类型
 * @param spaceId 空间ID（可选）
 * @returns
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

// 获取账号授权状态
export function getKwaiAuthStatus(taskId: string) {
  return http.post<GetKwaiAuthStatusRes>(`plat/kwai/auth/create-account/${taskId}`)
}
