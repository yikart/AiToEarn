export interface KwaiApiCommonResponse {
  result: number
  error_msg?: string
}

export type KwaiApiResponse<T> = T & KwaiApiCommonResponse

export interface KwaiOAuthCredentialsResponse {
  result: number
  refresh_token: string
  access_token: string
  expires_in: number
  refresh_token_expires_in: number
  open_id: string
  scopes: string[]
}

export interface KwaiUserInfoResponse {
  user_info: {
    name: string
    sex: 'M' | 'F'
    fan: number
    follow: number
    head: string
    bigHead: string
    city: string
  }
}

export interface KwaiStartUploadResponse {
  upload_token: string
  endpoint: string
}

export interface KwaiVideoUploadResponse {
  result: number
}

export interface KwaiVideoInfo {
  photo_id: string
  caption: string
  cover: string
  play_url?: string
  create_time: number
  like_count: number
  comment_count: number
  view_count: number
  pending: boolean
}

export interface KwaiPublishVideoResponse {
  video_info: KwaiVideoInfo
}

export interface KwaiPhotoInfo {
  photo_id?: string
  caption?: string
  cover?: string
  play_url?: string
  create_time?: number
  like_count?: number
  comment_count?: number
  view_count?: number
  pending?: boolean
}

export interface KwaiPhotoListResponse {
  video_list?: KwaiPhotoInfo[]
}
