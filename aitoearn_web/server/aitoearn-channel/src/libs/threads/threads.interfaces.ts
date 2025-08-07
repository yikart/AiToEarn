export interface ThreadsPost {
  reply_control?: string
  allowlisted_country_codes?: string[]
  alt_text?: string
  auto_publish_text?: boolean
  topic_tags?: string
}

export interface ThreadsContainerRequest {
  is_carousel_item?: boolean
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'TEXT'
  image_url?: string
  video_url?: string
  text?: string
  children?: string[]
}

export interface ThreadsPostResponse {
  id: string
}

export interface ThreadsObjectInfo {
  id: string
  status: string
}

export interface ThreadsInsightsRequest {
  metric: string,
  since?: number
  until?: number
}

export interface ThreadsInsightsMetricTotalValue {
  value: number
}
export interface ThreadsInsightsMetricResult {
  id: string
  name: string
  title: string
  description: string
  period: string
  total_value?: ThreadsInsightsMetricTotalValue
  values?: ThreadsInsightsMetricTotalValue[]
}

export interface ThreadsPagination {
  next: string
  previous: string
}
export interface ThreadsInsightsResponse {
  data: ThreadsInsightsMetricResult[]
  paging: ThreadsPagination
}

export interface publicProfileResponse {
  follower_count: number
  likes_count: number
  quotes_count: number
  replies_count: number
  reposts_count: number
  views_count: number
}

export interface ThreadsPost {
  id: string
}

export interface ThreadsPostResponse {
  data: ThreadsPost[],
  paging: ThreadsPagination
}
