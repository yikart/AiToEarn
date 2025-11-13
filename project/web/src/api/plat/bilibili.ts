import type { BiblPartItem } from '@/components/PublishDialog/publishDialog.type'
// 创建或更新账户
import http from '@/utils/request'

/**
 *  获取B站登录地址
 * @param type 授权类型
 * @param spaceId 空间ID（可选）
 * @returns
 */
export function apiGetBilibiliLoginUrl(type: 'h5' | 'pc', spaceId?: string) {
  const params = spaceId ? { spaceId } : {}
  return http.get<{ code: number, data: { taskId: string, url: string } }>(
    `plat/bilibili/auth/url/${type}`,
    params,
  )
}

/**
 * 检查B站授权状态
 * @param accointId 账号ID
 * @returns
 */
export function apiCheckAccountAuthStatus(accointId: string) {
  return http.get<{ code: number, data: boolean }>(
    `plat/bilibili/auth/status/${accointId}`,
  )
}

/**
 * 获取B站授权状态
 * @param taskId 任务ID
 * @returns
 */
export function apiCheckBilibiliAuth(taskId: string) {
  return http.post<{ code: number, data: any }>(
    `plat/bilibili/auth/create-account/${taskId}`,
  )
}

/**
 * 获取B站分区列表
 * @param accountId 账户ID
 * @returns
 */
export function apiGetBilibiliPartitions(accountId: string) {
  return http.get<BiblPartItem[]>(
    `plat/bilibili/archive/type/list/${accountId}`,
  )
}
