export enum PubStatus {
  UNPUBLISH = 0, // 未发布/草稿
  RELEASED = 1, // 已发布
  FAIL = 2, // 发布失败
  PartSuccess = 3, // 部分成功
}

export enum PubType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article', // 文章
}

export interface PubRecord {
  id: string
  userId: string
  accountId: string
  commonCoverPath?: string
  coverPath?: string
  desc: string
  publishTime?: Date
  status: PubStatus
  timingTime?: Date
  title: string
  type: PubType
  videoPath?: string
}

export enum MaterialType {
  VIDEO = 'video', // 视频
  ARTICLE = 'article', // 文章
}

export enum MaterialStatus {
  WAIT = 0,
  SUCCESS = 1,
  FAIL = -1,
}

export interface Material {
  id: string
  userId: string
  groupId?: string // 所属组ID
  type: MaterialType
  coverUrl?: string
  mediaList: MaterialMedia[]
  title: string
  desc: string
  status: MaterialStatus
  option: Record<string, any>
  createAt: Date
  updatedAt: Date
}

export interface MaterialMedia {
  url: string
  type: MediaType
  content?: string
}

export interface NewMaterial {
  groupId: string // 所属组ID
  coverUrl?: string
  mediaList: MaterialMedia[]
  title: string
  desc?: string
  option?: Record<string, any>
}

export interface NewMaterialTask {
  groupId: string
  num: number
  aiModelTag: string
  prompt: string
  title?: string
  desc?: string
  mediaGroups: string[]
  coverGroup: string
  option?: Record<string, any>
}

export interface MediaUrlInfo {
  url: string
  num: number
  type: MediaType
}

export enum MaterialTaskStatus {
  WAIT = 0,
  RUNNING = 1,
  SUCCESS = 2,
  FAIL = -1,
}

export interface MaterialTask {
  id: string
  userId: string
  userType?: string
  groupId: string // 所属组ID
  type: MaterialType
  aiModelTag: string
  prompt: string // 提示词
  coverGroup?: string
  mediaGroups: string[]
  option?: Record<string, any> // 高级设置
  title?: string
  desc?: string
  coverUrl?: string
  mediaList: MaterialMedia[]
  coverUrlList: MediaUrlInfo[] // 封面数组
  mediaUrlMap: MediaUrlInfo[][] // 媒体的二维数组
  reNum: number
  max?: number
  language?: '中文' | '英文'
  status: MaterialTaskStatus
}

export interface UpMaterial {
  title?: string
  desc?: string
  option?: Record<string, any>
}

export interface MaterialFilter {
  readonly userId: string
  readonly title?: string
  readonly groupId?: string
}

export interface MaterialGroup {
  id: string
  userId: string
  userType?: string
  title: string
  desc?: string
  createAt: Date
  updatedAt: Date
}

export enum MediaType {
  VIDEO = 'video', // 视频
  IMG = 'img', // 图片
}

export interface Media {
  id: string
  userId: string
  userType?: string
  groupId?: string // 所属组ID
  materialId?: string // 所属素材ID
  type: MaterialType
  url: string
  title?: string
  desc?: string
  createAt: Date
  updatedAt: Date
}

export interface NewMedia {
  userId: string
  userType?: string
  groupId: string // 所属组ID
  materialId?: string // 所属素材ID
  type: MediaType
  url: string
  thumbUrl?: string
  title?: string
  desc?: string
}

export interface MediaGroup {
  _id: string
  id: string
  userId: string
  title: string
  desc?: string
  type: MediaType
  createAt: Date
  updatedAt: Date
  mediaList?: { list: Media[], total: number }
}
export interface NewMaterialGroup {
  type: MaterialType
  userId: string
  userType?: string
  name: string
  readonly desc?: string
}

export interface UpdateMaterialGroup {
  name: string
  readonly desc?: string
}
