export interface ThreadsPost {
  reply_control?: string
  allowlisted_country_codes?: string[]
  alt_text?: string
  auto_publish_text?: boolean
  topic_tags?: string
  location_id?: string
}

export interface ThreadsContainerRequest {
  is_carousel_item?: boolean
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'TEXT'
  image_url?: string
  video_url?: string
  text?: string
  children?: string[]
  topic_tag?: string
  reply_to_id?: string
  location_id?: string
}

export interface ThreadsPostResponse {
  id: string
}

export interface ThreadsObjectInfo {
  id: string
  status: string
  permalink?: string
}

export interface ThreadsInsightsRequest {
  metric: string
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

export interface ThreadsPaginationReplies {
  next: string
  previous: string
  cursors?: { after: string, before: string }
}

export interface ThreadsInsightsResponse {
  data: ThreadsInsightsMetricResult[]
  paging: ThreadsPaginationReplies
}

export interface publicProfileResponse {
  follower_count: number
  likes_count: number
  quotes_count: number
  replies_count: number
  reposts_count: number
  views_count: number
}

export interface ThreadsPostItem {
  id: string
  text?: string
  media_product_type: string
  media_type: string
  media_url: string
  permalink: string
  thumbnail_url?: string
  timestamp: string
  children?: {
    data: {
      media_type: string
      media_url: string
    }[]
  }
  insights?: {
    data: ThreadsInsightsMetricResult[]
  }
}

export interface ThreadsPostsResponse {
  data: ThreadsPostItem[]
  paging: ThreadsPaginationReplies
}

export interface ThreadsPostsRequest {
  fields: string
  limit?: number
  before?: string
  after?: string
}

export interface ThreadsObjectCommentsRequest {
  fields: string
  reverse: boolean
  before?: string
  after?: string
}

export interface ThreadsComment {
  id: string
  text: string
  timestamp: string
  has_replies: boolean
  username: string
}

export interface ThreadsRepliesPagination {
  cursors: { after: string, before: string }
}
export interface ThreadsObjectCommentsResponse {
  data: ThreadsComment[]
  paging: ThreadsRepliesPagination
}

export interface ThreadsSearchLocationRequest {
  query: string
  fields?: string
}

export interface ThreadsLocation {
  id: string
  name: string
  address?: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  postal_code?: string
}

export interface ThreadsSearchLocationResponse {
  data: ThreadsLocation[]
}
