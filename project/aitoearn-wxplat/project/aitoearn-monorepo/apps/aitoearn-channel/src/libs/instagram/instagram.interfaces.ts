import { InstagramInsightsMetricTimeframe, InstagramInsightsMetricType, InstagramInsightsResultBreakdown, InstagramMediaInsightsResultBreakdown, InstagramMediaType } from './instagram.enum'

export interface ProductTag {
  product_id: string
  x: number
  y: number
}

export interface UserTag {
  username: string
  x: number
  y: number
}

export interface InstagramPost {
  content_category?: string
  alt_text?: string
  caption?: string
  collaborators?: string[]
  cover_url?: string
  image_url?: string
  location_id?: string
  product_tags?: ProductTag[]
  user_tags?: UserTag[]
}

export interface CreateMediaContainerRequest {
  alt_text?: string
  audio_name?: string
  caption?: string
  collaborators?: string[]
  children?: string[]
  cover_url?: string
  image_url?: string
  is_carousel_item?: boolean
  location_id?: string
  media_type?: InstagramMediaType
  product_tags?: ProductTag[]
  share_to_feed?: boolean
  thumb_offset?: number
  upload_type?: string
  user_tags?: UserTag[]
  video_url?: string
}

export interface CreateMediaContainerResponse {
  id: string
  uri?: string
}

export interface PublishMediaContainerRequest {
  creation_id: string
}

export interface PublishMediaContainerResponse {
  id: string
}

export interface ChunkedMediaUploadRequest extends CreateMediaContainerRequest {
  file_size: string
  offset: number
  file: Buffer
  ig_container_id: string
  upload_uri: string
}

export interface InstagramInsightsRequest {
  metric: string
  metric_type?: 'time_series' | 'total_value'
  breakdown?: InstagramInsightsResultBreakdown
  period?: 'day' | 'lifetime'
  since?: number
  until?: number
  timeframe?: InstagramInsightsMetricTimeframe
}

export interface InstagramInsightsBreakdownResult {
  dimension_values: string[]
  value: number
}

export interface InstagramInsightsBreakdown {
  dimension_keys: string[]
  results: InstagramInsightsBreakdownResult[]
}
export interface InstagramInsightsValue {
  value?: number
  breakdowns?: InstagramInsightsBreakdown[]
}
export interface InstagramInsightsResult {
  description: string
  id: string
  name: string
  period: string
  title: string
  total_value?: InstagramInsightsValue[]
  values: InstagramInsightsValue[]
}

export interface InstagramPaginationCursor {
  before: string
  after: string
}

export interface InstagramPagination {
  cursors: InstagramPaginationCursor
  next: string
  previous: string
}
export interface InstagramInsightsResponse {
  data: InstagramInsightsResult[]
  paging: InstagramPagination
}

export interface InstagramMediaInsightsRequest {
  breakdown?: InstagramMediaInsightsResultBreakdown
  metric: string
  period?: 'day' | 'lifetime' | 'week'
  metric_type?: InstagramInsightsMetricType
  since?: number
  until?: number
  timeframe?: InstagramInsightsMetricTimeframe
}

export interface InstagramObjectInfo {
  id: string
  status: string
}

export interface InstagramUserInfoRequest {
  fields: string
}

export interface InstagramUserInfoResponse {
  id: string
  followers_count: number
  follows_count: number
  media_count: number
}

export interface InstagramUserPostRequest {
  fields: string
  limit?: number
  after?: string
  before?: string
  since?: number
  until?: number
}

export interface InstagramUserPost {
  id: string
  caption?: string
  media_type: InstagramMediaType
  media_url: string
  permalink: string
  thumbnail_url?: string
  timestamp: string
  username: string
  like_count?: number
  comments_count?: number
  view_count?: number // just for reels
}

export interface InstagramUserPostResponse {
  data: InstagramUserPost[]
  paging: InstagramPagination
}

export interface IGPostCommentsRequest {
  fields: string
  after?: string
  before?: string
}

export interface IGPostComment {
  id: string
  text: string
  username: string
  timestamp: string
  from?: {
    username: string
    id: string
  }
  replies: {
    data: [{
      id: string
    }]
  }
}

export interface IGCommentsResponse {
  data: IGPostComment[]
  paging: InstagramPagination
}

export interface IGCommonResponse {
  id: string
}
