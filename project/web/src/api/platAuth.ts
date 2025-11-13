import http, { request } from '@/utils/request'

// 获取 YouTube 授权 URL
export function getYouTubeAuthUrlApi(mail: string, spaceId?: string) {
  const params: any = { type: 'pc' }
  if (spaceId) {
    params.spaceId = spaceId
  }
  return request({
    url: 'plat/youtube/auth/url',
    method: 'GET',
    params,
  })
}

/**
 * 获取youtube授权状态
 * @param taskId 任务ID
 * @returns
 */
export function apiCheckYoutubeAuth(taskId: string) {
  return http.post<{ code: number, data: any }>(
    `plat/youtube/auth/create-account/${taskId}`,
  )
}

export function checkYouTubeAuthApi(data: any) {
  return request({
    url: `plat/youtube/auth/status/${data.accountId}`,
    method: 'GET',
  })
}

export function uploadYouTubeVideoApi(data: FormData) {
  return request({
    url: 'plat/youtube/videos/upload',
    method: 'POST',
    body: data,
  })
}

export function uploadYouTubeVideoSmallApi(data: FormData) {
  return request({
    url: 'plat/youtube/video/upload/small',
    method: 'POST',
    body: data,
  })
}

export function getYouTubeListApi(data: any) {
  return request({
    url: 'plat/youtube/videos/list',
    method: 'GET',
    params: data,
  })
}

/**
 * 获取facebook授权状态
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 * @returns
 */
export function getFacebookAuthUrlApi(mail: string, spaceId?: string) {
  const data: any = {
    platform: 'facebook',
  }
  if (spaceId) {
    data.spaceId = spaceId
  }
  return request({
    url: 'plat/meta/auth/url',
    method: 'POST',
    data,
  })
}

export function checkMetaAuthApi(taskId: any) {
  return request({
    url: `plat/meta/auth/info/${taskId}`,
    method: 'GET',
  })
}

/**
 * 获取instagram授权状态
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 * @returns
 */
export function getInstagramAuthUrlApi(mail: string, spaceId?: string) {
  const data: any = {
    platform: 'instagram',
  }
  if (spaceId) {
    data.spaceId = spaceId
  }
  return request({
    url: 'plat/meta/auth/url',
    method: 'POST',
    data,
  })
}

/**
 * 获取threads授权状态
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 * @returns
 */
export function getThreadsAuthUrlApi(mail: string, spaceId?: string) {
  const data: any = {
    platform: 'threads',
  }
  if (spaceId) {
    data.spaceId = spaceId
  }
  return request({
    url: 'plat/meta/auth/url',
    method: 'POST',
    data,
  })
}

/**
 * 获取linkedin授权链接
 * 逻辑与facebook一致，仅platform传linkedin
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 */
export function getLinkedInAuthUrlApi(mail: string, spaceId?: string) {
  const data: any = {
    platform: 'linkedin',
  }
  if (spaceId) {
    data.spaceId = spaceId
  }
  return request({
    url: 'plat/meta/auth/url',
    method: 'POST',
    data,
  })
}

/**
 * 获取tiktok授权状态
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 * @returns
 */
export function getTiktokAuthUrlApi(mail: string, spaceId?: string) {
  const data: any = { type: 'pc' }
  if (spaceId) {
    data.spaceId = spaceId
  }
  return request({
    url: 'plat/tiktok/auth/url',
    method: 'POST',
    data,
  })
}

export function checkTiktokAuthApi(taskId: any) {
  return request({
    url: `plat/tiktok/auth/info/${taskId}`,
    method: 'GET',
  })
}

// 微信授权
export function getWxGzhAuthUrlApi(mail: string, spaceId?: string) {
  const params: any = { type: 'pc' }
  if (spaceId) {
    params.spaceId = spaceId
  }
  return request({
    url: 'plat/wxGzh/auth/url/pc',
    method: 'GET',
    params,
  })
}

export function checkWxGzAuthApi(taskId: any) {
  return request({
    url: `plat/wxGzh/auth/create-account/${taskId}`,
    method: 'GET',
  })
}

/**
 * 获取pinterest授权状态
 * @param mail 邮箱
 * @param spaceId 空间ID（可选）
 * @returns
 */
export function getPinterestAuthUrlApi(mail: string, spaceId?: string) {
  const params: any = {}
  if (spaceId) {
    params.spaceId = spaceId
  }
  return request({
    url: 'plat/pinterest/getAuth',
    method: 'GET',
    params,
  })
}

export function checkPinterestAuthApi(taskId: any) {
  return request({
    url: `plat/pinterest/checkAuth`,
    method: 'GET',
    params: {
      taskId,
    },
  })
}
