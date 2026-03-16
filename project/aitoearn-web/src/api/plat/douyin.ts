import http from '@/utils/request'

/**
 * 创建抖音授权
 * @param type 授权类型
 * @param spaceId 空间ID（可选）
 * @returns
 */
export function createDouyinAuth(type: 'h5' | 'pc', spaceId?: string) {
  const data: any = {
    spaceId: spaceId || '-',
  }
  return http.get<{
    url: string
    taskId: string
  }>(`plat/douyin/auth/url`, data)
}

/**
 * 获取抖音账号授权状态
 * @param taskId 任务ID
 * @returns
 */
export function getDouyinAuthStatus(taskId: string) {
  return http.post<{
    code: number
    data: {
      status: number
      account?: any
    }
  }>(`plat/douyin/auth/create-account/${taskId}`)
}

/**
 * 抖音直接发布参数
 */
export interface DouyinPublishCreateParams {
  title?: string
  desc?: string
  accountId?: string
  taskId?: string
  taskMaterialId?: string
  videoUrl?: string
  coverUrl?: string
  imgUrlList?: string[]
  topics: string[]
}

/**
 * 抖音直接发布
 * @param params 发布参数
 * @returns
 */
export function apiDouyinPublishCreate(params: DouyinPublishCreateParams) {
  return http.post<string>('plat/douyin/publish/create', params)
}
