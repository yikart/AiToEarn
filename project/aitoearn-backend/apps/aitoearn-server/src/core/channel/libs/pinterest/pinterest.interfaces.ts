// Pinterest API v5 Types
// Base docs: https://developers.pinterest.com/docs/api/v5/

// OAuth
// OAuth token exchange/refresh
// https://developers.pinterest.com/docs/api/v5/oauth-token
export interface PinterestOAuthCredential {
  access_token: string
  token_type?: string
  scope?: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
  refresh_token_expires_at?: number
}

// User Account (Get user account)
// https://developers.pinterest.com/docs/api/v5/user_account-get
export interface PinterestUserAccount {
  account_type: string
  id: string
  profile_image: string
  website_url?: string
  username: string
  about?: string
  business_name?: string
  board_count?: number
  pin_count?: number
  follower_count?: number
  following_count?: number
  monthly_views?: number
}

// Boards (Get a board)
// https://developers.pinterest.com/docs/api/v5/boards-get
export interface PinterestBoard {
  id: string
  name: string
  description?: string
  privacy?: 'PUBLIC' | 'SECRET'
  owner?: { username: string }
  created_at?: string
  collaborator_count?: number
  follower_count?: number
}

// Boards list (List boards)
// https://developers.pinterest.com/docs/api/v5/boards-list
export interface PinterestBoardsListResponse {
  items: PinterestBoard[]
  bookmark?: string
}

// Pins (Create pin - response is the created pin)
// https://developers.pinterest.com/docs/api/v5/pins-create
export interface PinterestPinMediaSource {
  source_type: 'pin_url' | 'image_url' | 'image_base64' | 'multiple_image_urls' | 'multiple_image_base64' | 'video_id'
  url?: string
  items?: PinterestPinMediaItem[]
  media_id?: string
  cover_image_url?: string
}

export interface PinterestPinMediaItem {
  url: string
  title?: string
  description?: string
  link?: string
}

// Pin object (used by create/get/list responses)
// https://developers.pinterest.com/docs/api/v5/pins-get
export interface PinterestPin {
  id: string
  link?: string
  title?: string
  description?: string
  dominant_color?: string
  alt_text?: string
  board_id: string
  media?: unknown
  created_at?: string
}

// Pins list (List pins)
// https://developers.pinterest.com/docs/api/v5/pins-list
export interface PinterestPinsListResponse {
  items: PinterestPin[]
  bookmark?: string
}

// Media (Init media upload)
// https://developers.pinterest.com/docs/api/v5/media-create
export interface PinterestInitMediaUploadResponse {
  media_id: string
  upload_url: string
  upload_parameters: Record<string, string>
}
