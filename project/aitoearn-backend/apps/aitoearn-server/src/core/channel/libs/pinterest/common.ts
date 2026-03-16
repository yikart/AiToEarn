export interface PinterestApp {
  id: string
  secret: string
  authBackHost: string
  baseUrl: string
}

export enum Country {
  US = 'US',
  CN = 'CN',
  UK = 'UK',
}

export enum Currency {
  USD = 'USD',
  UNK = 'UNK',
}

export interface CreateBoardBody {
  name: string // board名称;
  accountId?: string
}

export interface CreatePinBody {
  link?: string // 点击链接;
  title?: string // 标题
  description?: string // 描述
  dominant_color?: string // RGB表示的颜色 主引脚颜色。十六进制数，例如“#6E7874”。
  alt_text?: string
  board_id: string // 此 Pin 所属的板块。
  media_source: MediaSource
  url?: string
  accountId?: string

}

export interface IPinterestOptions {
  boardId?: string
}

interface CreatePinBodyItem {
  url: string
  title?: string //
  description?: string
  link?: string
}

interface MediaSource {
  source_type: SourceType
  media_id?: string
  url?: string
  cover_image_url?: string
  items?: CreatePinBodyItem[]
}

export enum SourceType {
  multiple_image_base64 = 'multiple_image_base64',
  image_base64 = 'image_base64',
  multiple_image_urls = 'multiple_image_urls',
  image_url = 'image_url',
  video_id = 'video_id',
}

export enum ILoginStatus {
  wait = 0,
  success = 1,
  expired = 2,
}

export interface AuthInfo {
  status: number
  userId?: string
  taskId?: string
  accountId?: string
  access_token?: string
  expires_in?: number
  refresh_token_expires_in?: number
  userInfo?: object
}

export interface UserInfo {
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
