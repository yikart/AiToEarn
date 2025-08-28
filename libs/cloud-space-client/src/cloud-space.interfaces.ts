import { CloudSpaceRegion, CloudSpaceStatus } from '@yikart/common'

// 浏览器环境相关的数据类型定义
export interface CloudSpace {
  id: string
  userId: string
  instanceId: string
  region: CloudSpaceRegion
  status: CloudSpaceStatus
  ip: string
  password?: string
  expiredAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateCloudSpaceDto {
  userId: string
  region: CloudSpaceRegion
  profileName?: string
  month?: number
}

export interface ListCloudSpacesDto {
  userId?: string
  region?: CloudSpaceRegion
  status?: CloudSpaceStatus
  page?: number
  pageSize?: number
}

export interface GetCloudSpaceStatusDto {
  cloudSpaceId: string
}

export interface DeleteCloudSpaceDto {
  cloudSpaceId: string
}

export interface RenewCloudSpaceDto {
  cloudSpaceId: string
  month: number
}

// 浏览器配置文件相关的数据类型定义
export interface BrowserProfile {
  id: string
  accountId: string
  profileId: string
  cloudSpaceId?: string
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ListBrowserProfilesDto {
  accountId?: string
  profileId?: string
  cloudSpaceId?: string
  page?: number
  pageSize?: number
}

// MultiLogin 账号相关的数据类型定义
export interface MultiloginAccount {
  id: string
  email: string
  password: string
  maxProfiles: number
  currentProfiles: number
  token?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMultiloginAccountDto {
  email: string
  password: string
  maxProfiles?: number
}

export interface UpdateMultiloginAccountDto {
  id: string
  email?: string
  password?: string
  maxProfiles?: number
}

export interface ListMultiloginAccountsDto {
  page?: number
  pageSize?: number
  email?: string
  minMaxProfiles?: number
  maxMaxProfiles?: number
  hasAvailableSlots?: boolean
}

export interface IdDto {
  id: string
}
