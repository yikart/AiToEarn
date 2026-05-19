export interface DouyinAccessTokenInfo {
  access_token: string
  captcha: string
  desc_url: string
  description: string
  error_code: number // 0
  expires_in: number // 1296000,
  log_id: string
  open_id: string
  refresh_expires_in: number // 2592000,
  refresh_token: string
  scope: string
}

export interface DouyRefreshTokenInfo {
  captcha: string
  desc_url: string
  description: string
  error_code: number // 0
  expires_in: number // 1296000,
  refresh_token: string
}

export interface DouyinMiniAppCode2SessionInfo {
  session_key: string
  openid: string
  anonymous_openid?: string
  unionid?: string
}

export interface DouyinUserInfo {
  open_id: string
  nickname: string
  description: string
  e_account_role: string
  error_code: number // 0
  avatar: string
  client_key: string
  log_id: string
  union_id: string
}

export interface DouyinUserVideoListItem {
  item_id?: string
  video_id?: string
  share_url?: string
  title?: string
}

export interface DouyinUserVideoListResponse {
  list?: DouyinUserVideoListItem[]
  cursor?: number
  has_more?: boolean
  error_code?: number
  description?: string
}

export interface DouyinMiniAppVideoStatistics {
  share_count: number
  forward_count: number
  comment_count: number
  digg_count: number
  download_count: number
  play_count: number
}

export interface DouyinMiniAppVideoAnchor {
  anchor_type?: number
  anchor_id?: string
}

export interface DouyinMiniAppVideoItem {
  video_id?: string
  video_status: number
  media_type?: number
  share_url: string
  video_anchor?: DouyinMiniAppVideoAnchor
  title: string
  item_id: string
  is_top: boolean
  create_time: string
  is_reviewed: boolean
  statistics?: DouyinMiniAppVideoStatistics
  cover: string
}

export interface DouyinMiniAppVideoQueryExtra {
  now: string
  error_code: number
  description: string
  sub_error_code: number
  sub_description: string
  logid: string
}

export interface DouyinMiniAppVideoQueryData {
  extra?: DouyinMiniAppVideoQueryExtra
  data?: {
    list: DouyinMiniAppVideoItem[]
  }
}

export interface DouyinClientTokenInfo {
  captcha: string
  desc_url: string
  description: string
  error_code: number // 0
  expires_in: number // 7200,
  access_token: string
}

export interface DouyinOpenTicketInfo {
  error_code: number // 2094425643568381000,
  description: string // "\"access_token无效\"",
  expires_in: number // 509909681054971900,
  ticket: string // "bxLdikRXVbTPdHSM05e5u5sUoXNKd8"
}

export enum DouyinDownloadType {
  Allow = 1,
  Disallow = 2,
}

export enum DouyinPrivateStatus {
  All = 0,
  Self = 1,
  Friend = 2,
}

// 分享发布的option
export interface DouyinShareSchemaOptions {
  shareId?: string // shareid
  hashtag_list?: string[]
  title?: string
  short_title?: string
  title_hashtag_list?: { name: string, start: number }[]
  downloadType?: DouyinDownloadType // 1: 允许 2：不允许
  privateStatus?: DouyinPrivateStatus // 0：全部人可见，1：自己可见，2：好友可见
  image_list_path?: string[]
  video_path?: string
}
