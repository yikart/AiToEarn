export interface FacebookPostOptions {
  page_id: string
  content_category?: string
  content_tags?: string[]
  custom_labels?: string[]
  direct_share_status?: number
  embeddable?: boolean
}

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

export interface InstagramPostOptions {
  alt_text?: string
  caption?: string
  collaborators?: string[]
  cover_url?: string
  image_url?: string
  location_id?: string
  product_tags?: ProductTag[]
  user_tags?: UserTag[]
}

export interface ThreadsPostOptions {
  reply_control?: string
  allowlisted_country_codes?: string[]
  alt_text?: string
  auto_publish_text?: boolean
  topic_tags?: string
}
