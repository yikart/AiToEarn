// 快手 oauth2/access_token
export interface KwaiAccessTokenResponse {
  result: number
  refresh_token: string
  access_token: string
  // access_token 的过期时间，单位为秒，有效期为48小时。
  expires_in: number
  // refresh_token 的过期时间，单位为秒，有效期为180天。
  refresh_token_expires_in: number
  open_id: string
  scopes: string[]
}

// 快手 openapi/user_info
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

// 快手 photo/start_upload
export interface KwaiStartUpload {
  result: number
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

// 快手视频发布结果
export interface KwaiVideoPubResult {
  // 是否成功
  success: boolean
  // 失败消息
  failMsg?: string
  // 作品ID
  worksId?: string
}

// 快手/openapi/photo/publish 响应
export interface KwaiPublishVideoInfo {
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
  // 	作品状态(是否还在处理中，不能观看)
  pending: boolean
}
