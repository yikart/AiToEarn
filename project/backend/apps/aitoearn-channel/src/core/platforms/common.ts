export interface AuthTaskInfo<T> {
  taskId: string
  spaceId?: string
  transpond?: string // nats转发
  accountAddPath?: string // 账户添加路径
  data?: T
  status: -1 | 0 | 1 // -1: 未开始,  0: 进行中, 1: 完成
  error?: string // 错误信息
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
