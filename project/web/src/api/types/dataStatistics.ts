// getStatisticsPeriodApi 入参
import type { PlatType } from '@/app/config/platConfig'

export interface StatisticsPeriodApiParams {
  startDate: string
  endDate: string
  queries: {
    platform: string
    uid: string
  }[]
}

export interface StatisticsPeriodModel {
  items?: StatisticsPeriodItems[]
  queryCount: number
  successCount: number
  groupedByDate: GroupedByDate[]
}

export interface StatisticsPeriodItems {
  platform: PlatType
  uid: string
  items?: StatisticsPeriodItems2[]
}

export interface StatisticsPeriodItems2 {
  id: string
  platform: string
  snapshotDate: string
  uid: string
  accountId: string
  commentCount?: number
  createdAt: string
  followingCount?: number
  likeCount?: number
  status: number
  updatedAt: string
  userId: string
  snapshotDateAsDate: string
  fansCount: number
  readCount?: number
  collectCount?: number
  forwardCount?: number
  workCount: number
}

export interface GroupedByDate {
  date: string
  records: Records[]
  count: number
}

export interface Records {
  id: string
  platform: string
  snapshotDate: string
  uid: string
  accountId: string
  commentCount: number
  createdAt: string
  followingCount: number
  likeCount: number
  status: number
  updatedAt: string
  userId: string
  snapshotDateAsDate: string
  fansCount: number
  readCount: number
  collectCount: number
  forwardCount: number
  workCount: number
}
