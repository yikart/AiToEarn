export interface ArchiveTypeChild {
  description: string
  id: number
  name: string
  parent: number
}
export interface ArchiveTypeItem {
  children: ArchiveTypeChild[]
  description: string
  id: number
  name: string
  parent: number
}
export interface ArchiveListItem {
  addit_info: {
    reject_reason: string
    state: number
    state_desc: string
  }
  copyright: number
  cover: string
  ctime: number
  desc: string
  no_reprint: number
  ptime: number
  resource_id: string
  tag: string
  tid: number
  title: string
  video_info: {
    cid: number
    duration: number
    filename: string
    iframe_url: string
    share_url: string
  }
}
export interface ArchiveListPage {
  pn: number
  ps: number
  total: number
}
export interface ArchiveListData {
  list: ArchiveListItem[]
  page: ArchiveListPage
}
export interface UserStatData {
  arc_passed_total: number
  follower: number
  following: number
}
export interface ArcStatData {
  coin: number
  danmaku: number
  favorite: number
  like: number
  ptime: number
  reply: number
  share: number
  title: string
  view: number
}
export interface ArcIncStatData {
  inc_click: number
  inc_coin: number
  inc_dm: number
  inc_elec: number
  inc_fav: number
  inc_like: number
  inc_reply: number
  inc_share: number
}
export interface ArchiveAddByUtokenData {
  resource_id: string
}
// ...existing code...

export enum VideoUTypes {
  Little = 0,
  Big = 1,
}

export interface CommonResponse<T> {
  code: number // 0;
  message: string // '0';
  ttl: number // 1;
  data: T
}

export interface AccessToken {
  access_token: string // 'd30bedaa4d8eb3128cf35ddc1030e27d';
  expires_in: number // 1630220614;
  refresh_token: string // 'WxFDKwqScZIQDm4iWmKDvetyFugM6HkX';
  scopes: string[] // ['USER_INFO', 'ATC_DATA', 'ATC_BASE'];
}

export interface AddArchiveData {
  title: string // 标题
  cover?: string // 封面url
  tid: number // 分区ID，由获取分区信息接口得到
  no_reprint?: 0 | 1 // 是否允许转载 0-允许，1-不允许。默认0
  desc?: string // 描述
  tag: string // 标签, 多个标签用英文逗号分隔，总长度小于200
  copyright: 1 | 2 // 1-原创，2-转载(转载时source必填)
  source?: string // 如果copyright为转载，则此字段表示转载来源
  topic_id?: number // 参加的话题ID，默认情况下不填写，需要填写和运营联系
}

export interface BilibiliUser {
  face: string // 'https://i0.hdslb.com/bfs/face/43d971688595deed3b3c27b61225c0fe67d3076b.jpg';
  name: string // 'user_80800215578';
  openid: string // 'fc9899b46ff443cea38190d355d49f3a';
}

// status?: 'all' | 'is_pubing' | 'pubed' | 'not_pubed';
export enum ArchiveStatus {
  all = 'all',
  is_pubing = 'is_pubing',
  pubed = 'pubed',
  not_pubed = 'not_pubed',
}

export interface GrantScopes {
  openid: string
  scopes: string[]
}

export interface videoInitialData {
  upload_token: string
}

export interface etagData {
  etag: string
}

export interface DeleteVideoData {
  code: number
  message: string
  ttl: number
}
