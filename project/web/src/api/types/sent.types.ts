// Sent界面相关的类型定义

export interface SentPost {
  id: string
  accountId: string // 账户ID，用于映射头像和平台信息
  accountType: string // 平台类型
  dataId: string // 数据ID
  title: string
  desc: string // 描述内容
  coverUrl: string // 封面图片
  imgUrlList: string[] // 图片列表
  type: string // 类型：video, image, carousel_album 等
  workLink: string // 作品链接
  publishTime: string // 发布时间 ISO格式
  publishingChannel: string // 发布渠道
  status: number // 状态
  uid: string
  flowId: string
  errorMsg: string
  engagement: {
    viewCount: number
    commentCount: number
    likeCount: number
    shareCount: number
    clickCount: number
    impressionCount: number
    favoriteCount: number
  }
}

export interface SentPostsResponse {
  code: number
  message: string
  url: string
  data: {
    total: number
    posts: SentPost[]
    hasMore: boolean
  }
}

export interface SentPostsParams {
  platform?: string
  uid?: string
  page: number
  pageSize: number
}
