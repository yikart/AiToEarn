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
  link: string // 点击链接;
  title: string // 标题
  description: string // 描述
  dominant_color: string // RGB表示的颜色 主引脚颜色。十六进制数，例如“#6E7874”。
  alt_text: string
  board_id: string // 此 Pin 所属的板块。
  media_source: MediaSource
  media_id?: string
  url?: string
  items?: CreatePinBodyItem[]
  accountId?: string

}

interface CreatePinBodyItem {
  url: string
  title?: string //
  description?: string
  link?: string
}

interface MediaSource {
  source_type: SourceType
}

export interface SourceType {
  multiple_image_base64: 'multiple_image_base64' //
  image_base64: 'image_base64' //
  multiple_image_url: 'multiple_image_url' //
  image_url: 'image_url' //
  video_id: 'video_id' //
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
}
