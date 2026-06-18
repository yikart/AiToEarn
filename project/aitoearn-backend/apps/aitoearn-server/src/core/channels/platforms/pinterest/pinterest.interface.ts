export interface PinterestTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
}

export enum PinterestOAuthGrantType {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export interface PinterestUser {
  id: string
  username: string
  profile_image?: string
  business_name?: string
  account_type?: string
  about?: string
  website_url?: string
  board_count?: number | null
  follower_count?: number | null
  following_count?: number | null
  monthly_views?: number | null
  pin_count?: number | null
}

export interface PinterestBoard {
  id: string
  name: string
  description?: string
  privacy: string
}

export interface PinterestPin {
  id: string
  title?: string
  description?: string
  link?: string
  media?: {
    media_type?: string
    images?: {
      '1200x': { url: string, width: number, height: number }
    }
  }
  board_id?: string
  created_at?: string
}

export enum PinterestAnalyticsMetricType {
  Impression = 'IMPRESSION',
  Save = 'SAVE',
  PinClick = 'PIN_CLICK',
  OutboundClick = 'OUTBOUND_CLICK',
  VideoMrcView = 'VIDEO_MRC_VIEW',
}

export type PinterestAnalyticsMetricValues = Partial<Record<PinterestAnalyticsMetricType, number>>

export interface PinterestPinAnalyticsDailyMetric {
  date?: string
  metrics?: PinterestAnalyticsMetricValues
  data_status?: string
}

export interface PinterestPinAnalyticsMetricGroup {
  daily_metrics?: PinterestPinAnalyticsDailyMetric[]
  lifetime_metrics?: PinterestAnalyticsMetricValues
  summary_metrics?: PinterestAnalyticsMetricValues
}

export type PinterestPinAnalyticsResponse = Record<string, PinterestPinAnalyticsMetricGroup>

export interface PinterestMediaUpload {
  media_id: string
  upload_url: string
  upload_parameters: Record<string, string>
}

export enum PinterestMediaStatusValue {
  Registered = 'registered',
  Processing = 'processing',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

export interface PinterestMediaStatus {
  media_id: string
  status: PinterestMediaStatusValue
}

export enum PinterestMediaType {
  Video = 'video',
}

export enum PinterestPinMediaSourceType {
  ImageUrl = 'image_url',
  ImageBase64 = 'image_base64',
  VideoUrl = 'video_url',
  VideoId = 'video_id',
}

export type PinterestPinMediaSource
  = | { source_type: PinterestPinMediaSourceType.ImageUrl, url: string }
    | {
      source_type: PinterestPinMediaSourceType.ImageBase64
      content_type: 'image/jpeg'
      data: string
    }
    | { source_type: PinterestPinMediaSourceType.VideoUrl, url: string }
    | {
      source_type: PinterestPinMediaSourceType.VideoId
      media_id: string
      cover_image_url?: string
    }

export interface PinterestCreatePinBody {
  board_id: string
  title?: string
  description?: string
  link?: string
  alt_text?: string
  media_source?: PinterestPinMediaSource
}

export interface PinterestCreatePinParams {
  boardId: string
  title?: string
  description?: string
  link?: string
  imageUrl?: string
  imageBase64?: string
  videoUrl?: string
  videoMediaId?: string
  coverImageUrl?: string
  altText?: string
}

export interface PinterestUpdatePinBody {
  title?: string
  description?: string
  link?: string
  board_id?: string
}

export interface PinterestUpdatePinParams {
  title?: string
  description?: string
  link?: string
  boardId?: string
}

export interface PinterestListPinsParams {
  bookmark?: string
  pageSize?: number
}

export function buildPinterestPinWorkLink(pinId: string): string {
  return `https://www.pinterest.com/pin/${pinId}/`
}
