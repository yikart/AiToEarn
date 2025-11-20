import { UserType } from '@yikart/common'
import { FileMetadata } from '@yikart/mongodb'

export enum PubStatus {
  UNPUBLISH = 0, // Unpublished/Draft
  RELEASED = 1, // Published
  FAIL = 2, // Publish failed
  PartSuccess = 3, // Partially successful
}

export enum PubType {
  VIDEO = 'video', // Video
  ARTICLE = 'article', // Article
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
  VIDEO = 'video', // Video
  ARTICLE = 'article', // Article
}

export enum MaterialStatus {
  WAIT = 0,
  SUCCESS = 1,
  FAIL = -1,
}

export interface Material {
  id: string
  userId: string
  groupId?: string // Group ID
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
  id?: string
  url: string
  type: MediaType
  thumbUrl?: string
  metadata?: FileMetadata
  content?: string
}

export interface NewMaterial {
  id?: string
  userId: string
  userType?: UserType
  taskId?: string
  type: MaterialType
  groupId: string // Group ID
  coverUrl?: string
  mediaList: MaterialMedia[]
  title: string
  desc?: string
  location?: number[]
  option?: Record<string, any>
  autoDeleteMedia?: boolean
  status: MaterialStatus
}

export interface NewMaterialTask {
  groupId: string
  num: number
  aiModelTag: string
  prompt: string
  type: MaterialType
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
  groupId: string // Group ID
  type: MaterialType
  aiModelTag: string
  prompt: string // Prompt
  systemPrompt?: string // System prompt
  coverGroup?: string
  mediaGroups: string[]
  option?: Record<string, any> // Advanced settings
  coverUrlList: MediaUrlInfo[] // Cover array
  mediaUrlMap: MediaUrlInfo[][] // 2D array of media
  reNum: number
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
  VIDEO = 'video', // Video
  IMG = 'img', // Image
}

export interface Media {
  id: string
  userId: string
  userType?: string
  groupId?: string // Group ID
  materialId?: string // Material ID
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
  groupId?: string // Group ID
  materialId?: string // Material ID
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
