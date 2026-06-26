import type { ChannelAccountAuthStart, ChannelAccountAuthStatus, ChannelCreatePublishFlowParams, ChannelOAuthLoginStart, ChannelPlatformListOptions, ChannelPublicPublishRecordItem, ChannelPublishFlowVo, ChannelPublishRecordItem, ChannelPublishRecordListVo, ChannelPublishRecordQueryParams, ChannelPublishTaskActionVo, ChannelPublishUserActionVo, ChannelWorkAnalyticsVo, ChannelWorkQueryParams, PlatformMetadataVo, StartChannelAccountAuthParams, StartChannelOAuthLoginParams } from './channel.types'
import type { PlatType } from '@/app/config/platConfig'
import http, { request } from '@/utils/request'

// Source: channelAuth.ts
/**
 * 开始平台授权
 * 生成平台 OAuth 授权 URL
 */
export function startChannelAccountAuthApi(
  platform: PlatType,
  params?: StartChannelAccountAuthParams,
) {
  return request<ChannelAccountAuthStart>({
    url: `v2/channels/accounts/auth/${platform}`,
    method: 'GET',
    params: {
      callbackUrl: params?.callbackUrl,
      redirectUri: params?.redirectUri,
      groupId: params?.groupId,
    },
    credentials: 'include',
  })
}

/**
 * 查询授权状态
 * 轮询平台授权 Session 状态
 */
export function getChannelAccountAuthStatusApi(platform: PlatType, sessionId: string) {
  return request<ChannelAccountAuthStatus>({
    url: `v2/channels/accounts/auth/${platform}/status/${sessionId}`,
    method: 'GET',
    silent: true,
  })
}

/**
 * 开始平台 OAuth 登录
 * 生成平台 OAuth 登录授权 URL。
 */
export function startChannelOAuthLoginApi(
  platform: PlatType,
  params?: StartChannelOAuthLoginParams,
) {
  return request<ChannelOAuthLoginStart>({
    url: `v2/channels/oauth/${platform}`,
    method: 'GET',
    params: {
      redirectUri: params?.redirectUri,
      inviteCode: params?.inviteCode,
    },
  })
}

// Source: channelPlatforms.ts
/**
 * 获取所有平台元数据
 * 返回已注册平台的元数据列表，包括展示名、logo、能力声明等
 */
export function getChannelPlatformsApi(options?: ChannelPlatformListOptions) {
  return http.get<PlatformMetadataVo[]>('v2/channels/platforms', undefined, true, {
    ...(options?.fresh ? { cache: 'no-store' } : {}),
  })
}

// Source: channelPublish.ts
function encodePathSegment(value: string) {
  return encodeURIComponent(value)
}

/**
 * 创建发布 Flow
 * 创建多平台发布 flow，一次请求可生成多个单平台任务
 */
export function createChannelPublishFlowApi(data: ChannelCreatePublishFlowParams) {
  return http.post<ChannelPublishFlowVo>('v2/channels/publish/flows', data)
}

/**
 * 获取 Flow 详情
 * 根据 flowId 获取发布 flow 聚合信息
 */
export function getChannelPublishFlowApi(flowId: string) {
  return http.get<ChannelPublishFlowVo>(`v2/channels/publish/flows/${flowId}`)
}

/**
 * 获取发布历史
 * 分页获取用户发布历史记录
 */
export function getChannelPublishRecordsApi(params?: ChannelPublishRecordQueryParams) {
  return http.get<ChannelPublishRecordListVo>('v2/channels/publish/records', params)
}

/**
 * 获取发布记录详情
 * 根据记录 ID 获取发布记录详情
 */
export function getChannelPublishRecordApi(recordId: string) {
  return http.get<ChannelPublishRecordItem>(`v2/channels/publish/records/${encodePathSegment(recordId)}`)
}

/**
 * 获取发布记录用户操作信息
 * 获取抖音等待用户操作发布记录的 App scheme 和短链接
 */
export function getChannelPublishUserActionApi(recordId: string) {
  return http.get<ChannelPublishUserActionVo>(`v2/channels/publish/records/${encodePathSegment(recordId)}/user-action`, undefined, true)
}

/**
 * 公开查询发布记录
 * 根据记录 ID 公开查询发布状态、作品链接等基础信息
 */
export function getChannelPublicPublishRecordApi(recordId: string) {
  return http.get<ChannelPublicPublishRecordItem>(`v2/channels/publish/records/public/${encodePathSegment(recordId)}`, undefined, true)
}

/**
 * 删除发布记录
 * 删除当前用户的终态本地发布记录，不删除平台作品
 */
export function deleteChannelPublishRecordApi(recordId: string) {
  return http.delete<void>(`v2/channels/publish/records/${encodePathSegment(recordId)}`)
}

/**
 * 立即发布
 * 将定时任务调整为立即发布
 */
export function publishChannelTaskNowApi(taskId: string) {
  return http.post<ChannelPublishTaskActionVo>(`v2/channels/publish/tasks/${encodePathSegment(taskId)}/publish-now`)
}

/**
 * 重试发布任务
 * 重试当前用户失败的发布任务
 */
export function retryChannelPublishTaskApi(taskId: string) {
  return http.post<ChannelPublishTaskActionVo>(`v2/channels/publish/tasks/${encodePathSegment(taskId)}/retry`)
}

/**
 * 取消发布任务
 * 取消指定的发布任务
 */
export function cancelChannelPublishTaskApi(taskId: string) {
  return http.delete<ChannelPublishTaskActionVo>(`v2/channels/publish/tasks/${encodePathSegment(taskId)}`)
}

/**
 * 修改发布时间
 * 修改待发布任务的发布时间
 */
export function updateChannelPublishAtApi(taskId: string, publishAt: string) {
  return http.patch<ChannelPublishTaskActionVo>(`v2/channels/publish/tasks/${encodePathSegment(taskId)}/publish-at`, { publishAt })
}

/**
 * 获取作品数据
 * 获取指定作品的分析数据
 */
export function getChannelWorkAnalyticsApi(
  platform: PlatType,
  platformWorkId: string,
  params?: Pick<ChannelWorkQueryParams, 'accountId'>,
) {
  return http.get<ChannelWorkAnalyticsVo>(
    `v2/channels/works/${platform}/${encodePathSegment(platformWorkId)}/analytics`,
    params,
    true,
  )
}
