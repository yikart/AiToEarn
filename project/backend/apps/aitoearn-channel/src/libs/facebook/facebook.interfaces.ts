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
  video_file_chunk: Buffer<ArrayBuffer>
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
  page_id?: string
  content_category?: string
  content_tags?: string[]
  custom_labels?: string[]
  direct_share_status?: number
  embeddable?: boolean
}

export interface PublishFeedPostRequest {
  message: string
  published: boolean
  link?: string
}

export interface publishFeedPostResponse {
  id: string
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
  metric: string
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
  fields: string
}

export interface FacebookPagePicture {
  data: {
    url: string
  }
}
export interface FacebookPageDetailResponse {
  id: string
  fan_count: number
  followers_count: number
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
  field: string
  summary?: boolean
}

export interface FacebookPagePostAttachmentCover {
  height: number
  src: string
  width: number
}
export interface FacebookPagePostAttachmentMediaTarget {
  id: string
  url: string
}

export interface FacebookPagePostAttachmentMedia {
  image: FacebookPagePostAttachmentCover
  source?: string
  target: FacebookPagePostAttachmentMediaTarget
}
export interface FacebookPagePostAttachment {
  media: FacebookPagePostAttachmentMedia
  type: string
  url: string
}
export interface FacebookPostDetail {
  id: string
  created_time: string
  message?: string
  is_expired?: boolean
  is_published?: boolean
  permalink_url?: string
  attachments?: { data: FacebookPagePostAttachment[] }
  likes?: {
    summary?: { total_count?: number }
  }
  comments?: {
    summary?: { total_count?: number }
  }
  shares?: { count: number }
  insights?: {
    data?: FacebookInsightsResult[]
  }
}

export interface FacebookPagePostRequest {
  fields: string
  limit?: number
  after?: string
  before?: string
  next?: string
  previous?: string
}

export interface FacebookPostDetailResponse {
  data: FacebookPostDetail[]
  paging?: FacebookPagination
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
  video_id?: string
  upload_url?: string
  success?: boolean
  message?: string
  post_id?: string
}

export interface FacebookReelUploadRequest {
  offset: number
  file_size: number
  file: Buffer<ArrayBuffer>
}

export interface FacebookReelUploadResponse {
  success: boolean
}

export interface FacebookPhotoStoryRequest {
  photo_id: string
}

export interface FacebookPostCommentsRequest {
  filter?: 'stream' | 'toplevel'
  order?: 'chronological' | 'reverse_chronological'
  since?: string
  summary?: 'order' | 'total_count' | 'can_comment'
  fields: string
  before?: string
  after?: string
}

export interface FacebookPostComment {
  id: string
  message: string
  created_time: string
  from: {
    name: string
    id: string
    picture: { data: { url: string } }
  }
  comment_count: number
}

export interface FacebookPostCommentsResponse {
  data: FacebookPostComment[]
  paging: FacebookPagination
  summary?: {
    order: string
    total_count: number
    can_comment: boolean
  }
}

export interface FacebookCommonError {
  message: string
  type: string
  code: number
  fbtrace_id: string
}
export interface Location {
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  state?: string
  street?: string
  zip?: string
}

export interface FacebookPageInfo {
  id: string
  name: string
  location?: Location
  link?: string
}

export interface FacebookSearchPagesResponse {
  data: FacebookPageInfo[]
  paging?: FacebookPagination
  error?: FacebookCommonError
}

export interface FacebookSearchPagesRequest {
  q: string
  fields: string
}

export interface FacebookPostAttachmentMedia {
  source?: string
  image: {
    src: string
    width: number
    height: number
  }
}

export interface FacebookPostAttachment {
  type: 'photo' | 'video' | 'video_inline'
  media: FacebookPostAttachmentMedia
}

export interface FacebookPostAttachmentsResponse {
  data?: FacebookPostAttachment[]
}

export interface FacebookLikeResponse {
  success: boolean
}
