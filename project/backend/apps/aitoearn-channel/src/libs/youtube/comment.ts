export interface AccessToken {
  access_token: string // 'd30bedaa4d8eb3128cf35ddc1030e27d';
  expires_in?: number // 1630220614;
  refresh_token?: string // 'WxFDKwqScZIQDm4iWmKDvetyFugM6HkX';
  scopes?: string[] // ['USER_INFO', 'ATC_DATA', 'ATC_BASE'];
  token_type?: string
  id_token?: string
}

// 获取频道列表参数
export interface GetChannelsListParams {
  accountId: string
  forHandle?: string
  forUsername?: string
  id?: string[]
  mine?: boolean
  maxResults?: number
  pageToken?: string
}

export interface GetVideosListParams {
  accountId: string
  chart?: string
  id?: string
  myRating?: boolean
  maxResults?: number
  pageToken?: string
}
