import { UserType } from '@yikart/common'

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
  id?: string
  userId: string
  userType?: UserType
  taskId?: string
  type: MaterialType
  groupId: string // 所属组ID
  coverUrl?: string
  mediaList: MaterialMedia[]
  title: string
  desc?: string
  location?: number[]
  option?: Record<string, any>
  autoDeleteMedia?: boolean
}

export interface NewMaterialTask {
  groupId: string
  num: number
  aiModelTag: string
  prompt: string
  type: MaterialType
  title?: string
  desc?: string
  location?: number[]
  mediaGroups: string[]
  coverGroup: string
  option?: Record<string, any>
}

export interface MediaUrlInfo {
  id?: string
  mediaId: string
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
  userType: UserType
  groupId: string // 所属组ID
  type: MaterialType
  aiModelTag: string
  prompt: string // 提示词
  coverGroup?: string
  mediaGroups: string[]
  option?: Record<string, any> // 高级设置
  title?: string
  textMax?: number
  desc?: string
  location?: number[]
  coverUrl?: string
  coverUrlList: MediaUrlInfo[] // 封面数组
  mediaUrlMap: MediaUrlInfo[][] // 媒体的二维数组
  reNum: number
  max?: number
  language?: string
  status: MaterialTaskStatus
  autoDeleteMedia: boolean
}

export interface UpMaterial {
  title?: string
  desc?: string
  option?: Record<string, any>
}

export interface MaterialFilter {
  readonly userId?: string
  readonly userType?: string
  readonly status?: MaterialStatus
  readonly ids?: string[]
  readonly title?: string
  readonly groupId?: string
  readonly useCount?: number
}

export interface MaterialListByIdsFilter {
  readonly ids: string[]
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
  groupId?: string // 所属组ID
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
  createAt: Date
  updatedAt: Date
  mediaList?: { list: Media[], total: number }
}
export interface NewMaterialGroup {
  type: MaterialType
  userId: string
  userType?: UserType
  name: string
  readonly desc?: string
}

export interface UpdateMaterialGroup {
  name: string
  readonly desc?: string
}
