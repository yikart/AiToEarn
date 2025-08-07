export interface FacebookInitialVideoUploadRequest {
  upload_phase: 'start' | 'transfer' | 'finish' | 'cancel'
  file_size: number
  published: boolean
}

export interface FacebookInitialVideoUploadResponse {
  video_id: string
  upload_session_id: string
  start_offset: number
  end_offset: number
}

export interface ChunkedVideoUploadRequest {
  published: boolean
  upload_phase: 'start' | 'transfer' | 'finish' | 'cancel'
  upload_session_id: string
  start_offset: number
  end_offset: number
  video_file_chunk: Buffer
}

export interface finalizeVideoUploadRequest {
  upload_phase: 'start' | 'transfer' | 'finish' | 'cancel'
  upload_session_id: string
  published: boolean
}

export interface finalizeVideoUploadResponse {
  success: boolean
}

export interface ChunkedVideoUploadResponse {
  start_offset: number
  end_offset: number
}

export interface ResumeVideoUploadRequest {
  uploadSessionId: string
}

export interface FacebookPost {
  page_id: string
  content_category?: string
  content_tags?: string[]
  custom_labels?: string[]
  direct_share_status?: number,
  embeddable?: boolean
}

export interface PublishVideoPostRequest {
  description?: string
  title?: string
  crossposted_video_id: string
  published: boolean
}

export interface publishVideoPostResponse {
  id: string
}

export interface ResumeFileUploadResponse {
  id: string
  file_offset: number
}

export interface PublishVideoForPageRequest {
  file_url: string
  published: boolean
  description?: string
  title?: string
}

export interface PublishVideoForPageResponse {
  id: string
}

export interface PublishMediaPostResponse {
  id: string
  post_id?: string
}

export interface UploadPhotoResponse {
  id: string
  post_id: string
}

export interface PageAccessTokenData {
  access_token: string
  name: string
  id: string
}

export interface PageAccessTokenResponse {
  data: PageAccessTokenData[]
}

export interface FacebookObjectInfo {
  status: {
    video_status?: string
    uploading_phase?: {
      status: string
    }
    processing_phase?: {
      status: string
    }
    publishing_phase?: {
      status: string
    }
  }
  id: string
}

export interface FacebookInsightsValue {
  message_type: string
  messaging_channel: string
  campaign_id: string
  earning_source: string
  start_time: string
  end_time: string
  engagement_source: string
  monetization_tool: string
  recurring_notifications_entry_point: string
  recurring_notifications_frequency: string
  recurring_notifications_topic: string
  value: number
}

export interface FacebookInsightsResult {
  id: string
  name: string
  description: string
  description_from_api_docs: string
  period: string
  title: string
  values: FacebookInsightsValue[]
}

export interface FacebookPaginationCursor {
  before: string
  after: string
}

export interface FacebookPagination {
  cursors?: FacebookPaginationCursor
  next: string
  previous: string
}

export interface FacebookInsightsRequest {
  metric: string,
  period?: 'day' | 'week' | 'days_28' | 'month' | 'lifetime' | 'total_over_range'
  // enum{today, yesterday, this_month, last_month, this_quarter, maximum, data_maximum, last_3d, last_7d, last_14d, last_28d, last_30d, last_90d, last_week_mon_sun, last_week_sun_sat, last_quarter, last_year, this_week_mon_today, this_week_sun_today, this_year}
  date_preset?: 'today' | 'yesterday' | 'this_month'
    | 'last_month' | 'this_quarter' | 'maximum'
    | 'data_maximum' | 'last_3d' | 'last_7d'
    | 'last_14d' | 'last_28d' | 'last_30d'
    | 'last_90d' | 'last_week_mon_sun'
    | 'last_week_sun_sat' | 'last_quarter'
    | 'last_year' | 'this_week_mon_today'
    | 'this_week_sun_today' | 'this_year'
  show_description_from_api_docs?: boolean
  since?: string // ISO date string
  until?: string // ISO date string
}

export interface FacebookInsightsResponse {
  data: FacebookInsightsResult[]
  paging: FacebookPagination
}

export interface FacebookPageDetailRequest {
  fields: string,
}

export interface FacebookPagePicture {
  data: {
    url: string
  }
}
export interface FacebookPageDetailResponse {
  id: string,
  fan_count: number,
  followers_count: number,
  picture?: FacebookPagePicture
}

export interface FacebookPublishedPostRequest {
  summary?: boolean
}

export interface FacebookPagePost {
  id: string
  created_time: string
  message: string
}

export interface FacebookPublishedPostSummary {
  total_count: number
}

export interface FacebookPublishedPostResponse {
  data: FacebookPagePost[]
  paging: FacebookPagination
  summary?: FacebookPublishedPostSummary
}

export interface FacebookPostDetailRequest {
  field: string,
  summary?: boolean
}

export interface FacebookPostDetailResponse {
  id: string
  created_time: string
  shares?: { count: number }
}

export interface FacebookPostEdgesRequest {
  summary: boolean
  type?: 'LIKE'
}
export interface FacebookPostEdgesResponse {
  summary?: {
    total_count: number
  }
}

export interface FacebookReelRequest {
  upload_phase: 'start' | 'finish'
  video_state?: 'draft' | 'published' | 'scheduled'
  video_id?: string
  title?: string
  description?: string
  scheduled_publish_time?: number
}

export interface FacebookReelResponse {
  video_id?: string,
  upload_url?: string,
  success?: boolean,
  message?: string,
  post_id?: string,
}

export interface FacebookReelUploadRequest {
  offset: number
  file_size: number
  file: Buffer
}

export interface FacebookReelUploadResponse {
  success: boolean
}
