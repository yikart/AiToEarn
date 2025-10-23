export enum FeedbackType {
  errReport = 'errReport', // 错误反馈
  feedback = 'feedback', // 反馈
  msgReport = 'msgReport', // 消息举报
  msgFeedback = 'msgFeedback', // 消息反馈
}

export interface Feedback {
  id: string
  userId: string
  userName: string
  content: string
  type: FeedbackType
  tagList: string[]
  fileUrlList: string[]
  createAt: Date
  updatedAt: Date
}

export interface CreateFeedback {
  userId: string
  userName: string
  content: string
  type?: FeedbackType
  tagList?: string[]
  fileUrlList?: string[]
}

export interface ChannelAccountDataCube {
  // 粉丝数
  fensNum?: number
  // 播放量
  playNum?: number
  // 评论数
  commentNum?: number
  // 点赞数
  likeNum?: number
  // 分享数
  shareNum?: number
  // 收藏数
  collectNum?: number
  // 稿件数量
  arcNum?: number
}

// 增量数据:分7天新增或30天新增
export interface ChannelAccountDataBulk extends ChannelAccountDataCube {
  // 每天
  list: ChannelAccountDataCube[]
}

export interface ChannelArcDataCube {
  // 粉丝数
  fensNum?: number
  // 播放量
  playNum?: number
  // 评论数
  commentNum?: number
  // 点赞数
  likeNum?: number
  // 分享数
  shareNum?: number
  // 收藏数
  collectNum?: number
}

// 增量数据:分7天新增或30天新增
export interface ChannelArcDataBulk extends ChannelAccountDataCube {
  recordId: string
  dataId: string

  // 每天
  list: ChannelArcDataCube[]
}
