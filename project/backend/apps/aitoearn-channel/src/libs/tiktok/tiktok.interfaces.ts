import { TiktokPrivacyLevel } from './tiktok.enum'

// 基础发布信息
interface TiktokBasePostInfo {
  title?: string
  description?: string
  disable_comment?: boolean
  disable_duet?: boolean
  disable_stitch?: boolean
  auto_add_music?: boolean
  brand_content_toggle?: boolean
  brand_organic_toggle?: boolean
  video_cover_timestamp_ms?: number
}

export interface TiktokPostOptions {
  privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY' | 'FOLLOWER_OF_CREATOR'
  disable_duet?: boolean
  disable_stitch?: boolean
  disable_comment?: boolean
  brand_organic_toggle?: boolean
  brand_content_toggle?: boolean
}

// 视频来源信息
export type TiktokVideoSourceInfo
  = | {
    source: 'FILE_UPLOAD'
    video_size: number
    chunk_size: number
    total_chunk_count: number
  }
  | {
    source: 'PULL_FROM_URL'
    video_url: string
  }

// 照片来源信息
export interface TiktokPhotoSourceInfo {
  source: 'PULL_FROM_URL'
  photo_images: string[]
  photo_cover_index: number
}

// 视频发布请求
export interface TiktokVideoPublishRequest {
  post_info: TiktokBasePostInfo & {
    privacy_level: TiktokPrivacyLevel
  }
  source_info: TiktokVideoSourceInfo
}

// 照片发布请求
export type TiktokPhotoPublishRequest
  = | {
    media_type: 'PHOTO'
    post_mode: 'DIRECT_POST'
    post_info: TiktokBasePostInfo & {
      privacy_level: TiktokPrivacyLevel
    }
    source_info: TiktokPhotoSourceInfo
  }
  | {
    media_type: 'PHOTO'
    post_mode: 'MEDIA_UPLOAD'
    post_info: TiktokBasePostInfo & {
      privacy_level?: TiktokPrivacyLevel
    }
    source_info: TiktokPhotoSourceInfo
  }

// 发布响应
export interface TiktokPublishResponse {
  publish_id: string
  upload_url?: string
}

export interface TikTokUserInfo {
  open_id: string
  union_id: string
  avatar_url: string
  username: string
  display_name: string
  bio_description: string
  follower_count?: number
  following_count?: number
  like_count?: number
  video_count?: number
}
export interface TiktokCreatorInfo {
  creator_avatar_url: string
  creator_username: string
  creator_nickname: string
  privacy_level_options: TiktokPrivacyLevel[]
  comment_disabled: boolean
  duet_disabled: boolean
  stitch_disabled: boolean
  max_video_post_duration_sec: number
}

// 导出通用的 PostInfo 类型供 Service 使用
export type TiktokPostInfo = TiktokBasePostInfo & {
  privacy_level: TiktokPrivacyLevel
}

// OAuth 响应类型定义
export interface TiktokOAuthResponse {
  access_token: string
  expires_in: number
  open_id: string
  refresh_token: string
  refresh_expires_in: number
  scope: string
  token_type: string
}

// 发布状态响应类型定义
export interface TiktokPublishStatusResponse {
  status:
    | 'PROCESSING_DOWNLOAD'
    | 'PROCESSING_UPLOAD'
    | 'PROCESSING'
    | 'PUBLISHED'
    | 'FAILED'
  fail_reason?: string
}

// 撤销令牌响应类型
export interface TiktokRevokeResponse {
  message: string
}

export interface TikTokUserInfoResponse {
  data: {
    user: TikTokUserInfo
  }
}

export interface TikTokVideo {
  id: string
  create_time: number
  cover_image_url: string
  share_url: string
  video_description: string
  duration: number
  height: number
  width: number
  title: string
  embed_html: string
  embed_link: string
  like_count: number
  comment_count: number
  share_count: number
  view_count: number
}

export interface TikTokListVideosResponse {
  data: {
    videos: TikTokVideo[]
    has_more: boolean
    cursor: string
  }
  error?: {
    code: number
    message: string
    log_id: string
  }
}

export interface TikTokListVideosParams {
  fields: string
  cursor?: number
  max_count?: number
}
