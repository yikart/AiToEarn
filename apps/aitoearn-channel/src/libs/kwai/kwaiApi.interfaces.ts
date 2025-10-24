export interface KwaiRefreshTokenQuery {
  app_id: string
  app_secret: string
  refresh_token: string
  grant_type: 'refresh_token'
}

export interface KwaiAccessTokenQuery {
  app_id: string
  app_secret: string
  code: string
  grant_type: 'authorization_code'
}

export interface KwaiUserInfo {
  name: string
  // "M：男性，"F":女性，其他：未知。
  sex: 'M' | 'F'
  fan: number
  follow: number
  head: string
  bigHead: string
  city: string
}

export interface KwaiUserInfoQuery {
  app_id: string
  access_token: string
}

// 快手 photo/start_upload
export interface KwaiStartUploadQuery {
  app_id: string
  access_token: string
}

export interface KwaiStartUploadResponse {
  upload_token: string
  endpoint: string
}

// 快手视频发布参数
export interface KwaiVideoPubParams {
  // 封面URL
  coverUrl: string
  // 视频URL
  videoUrl: string
  // 视频描述
  describe?: string
  // 视频话题
  topics?: string[]
}

export interface KwaiPublishVideoQuery {
  upload_token: string
  app_id: string
  access_token: string
}

export interface KwaiPublishVideoBody {
  caption: string
  cover: Buffer
}

export interface KwaiChunkedUploadQuery {
  fragment_id: number
  upload_token: string
}

export interface KwaiFinalizeUploadQuery {
  fragment_count: number
  upload_token: string
}

export interface KwaiPhotoListQuery {
  app_id: string
  access_token: string
  cursor?: string
  count?: number
}

export interface KwaiUserInfoResponse {
  user_info: KwaiUserInfo
}

export interface KwaiVideoInfo {
  // 作品id
  photo_id: string
  // 作品标题
  caption: string
  // 作品封面
  cover: string
  // 作品播放链接
  play_url: string
  // 作品创建时间
  create_time: number
  // 作品点赞数
  like_count: number
  // 作品评论数
  comment_count: number
  // 作品观看数
  view_count: number
  // 作品状态(是否还在处理中，不能观看)
  pending: boolean
}

export interface KwaiPublishVideoResponse {
  video_info: KwaiVideoInfo
}

export interface KwaiVideoListResponse {
  // unknown fields, please refine
  video_list: KwaiVideoInfo[]
}

export interface KwaiApiCommonResponse {
  result: number
  error_msg?: string
}

export interface KwaiOAuthCredentialsResponse {
  result: number // 1 success
  refresh_token: string
  access_token: string
  // access_token 的过期时间，单位为秒，有效期为48小时。
  expires_in: number
  // refresh_token 的过期时间，单位为秒，有效期为180天。
  refresh_token_expires_in: number
  open_id: string
  scopes: string[]
}

export interface KwaiVideoUploadResponse {
  result: number
}

export type KwaiApiResponse<T> = T & KwaiApiCommonResponse

// 发布视频的结果返回给上层 service 使用的封装（非开放平台直接返回字段）
export interface KwaiVideoPubResult {
  success: boolean
  worksId?: string
  failMsg?: string
}

export interface KwaiDeleteVideoResponse {
}
