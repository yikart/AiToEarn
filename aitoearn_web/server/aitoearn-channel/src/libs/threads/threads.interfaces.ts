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

export interface ThreadsAccountInsightsRequest {
  metric: string,
  since?: number
  until?: number
}

export interface ThreadsAccountInsightsMetricTotalValue {
  value: number
}
export interface ThreadsAccountInsightsMetricResult {
  id: string
  name: string
  title: string
  description: string
  period: string
  total_value: ThreadsAccountInsightsMetricTotalValue
}

export interface ThreadsPagination {
  next: string
  previous: string
}
export interface ThreadsAccountInsightsResponse {
  data: ThreadsAccountInsightsMetricResult[]
  paging: ThreadsPagination
}
