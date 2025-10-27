export interface AccessToken {
  access_token: string // 'd30bedaa4d8eb3128cf35ddc1030e27d';
  expires_in?: number // 1630220614;
  refresh_token?: string // 'WxFDKwqScZIQDm4iWmKDvetyFugM6HkX';
  scopes?: string[] // ['USER_INFO', 'ATC_DATA', 'ATC_BASE'];
  token_type?: string
  id_token?: string
}

export interface ChannelsList {
  handle?: string
  userName?: string
  id?: string
  mine?: boolean
}

export interface UpdateChannels {
  channelId?: string
  brandingSettings?: any
  status?: any
}

export interface VideoCategoriesList {
  id?: string
  regionCode?: string
}

export interface VideosList {
  id?: string
  myRating?: boolean
  maxResults?: number
  pageToken?: string
}

export interface CommentThreadsList {
  accountId: string
  allThreadsRelatedToChannelId?: string
  id?: string
  videoId?: string
  maxResults?: number
  pageToken?: string
  order?: string
  searchTerms?: string
}

export interface CommentsList {
  id?: string
  parentId?: string
  maxResults?: number
  pageToken?: string
}

export interface InsertComment {
  snippet: {
    parentId?: string
    textOriginal?: string
  }
}

// YouTube视频上传初始化
export interface YoutubeStartUpload {
  result: number
  upload_token: string
  endpoint: string
}

// YouTube视频发布参数
export interface YoutubeVideoPubParams {
  // 封面URL
  coverUrl: string
  // 视频URL
  videoUrl: string
  // 视频描述
  describe?: string
  // 视频话题
  topics?: string[]
}

// YouTube视频发布结果
export interface YoutubeVideoPubResult {
  // 是否成功
  success: boolean
  // 失败消息
  failMsg?: string
  // 作品ID
  worksId?: string
}

// YouTube视频发布响应
export interface YoutubePublishVideoInfo {
  // 作品id
  photo_id: string
  // 作品标题
  caption: string
  // 作品封面
  cover: string
  // 作品播放链接
  play_url: string
  // 作品创建时间
  create_time: number
  // 作品点赞数
  like_count: number
  // 作品评论数
  comment_count: number
  // 作品观看数
  view_count: number
  // 作品状态(是否还在处理中，不能观看)
  pending: boolean
}
