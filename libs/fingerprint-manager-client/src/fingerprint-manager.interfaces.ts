import { BrowserEnvironmentRegion, BrowserEnvironmentStatus } from '@aitoearn/common'

// 浏览器环境相关的数据类型定义
export interface BrowserEnvironment {
  id: string
  userId: string
  region: BrowserEnvironmentRegion[number]
  status: BrowserEnvironmentStatus[number]
  ip: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateBrowserEnvironmentDto {
  userId: string
  region: BrowserEnvironmentRegion[number]
  profileName?: string
}

export interface ListBrowserEnvironmentsDto {
  userId?: string
  region?: BrowserEnvironmentRegion[number]
  status?: BrowserEnvironmentStatus[number]
  page: number
  pageSize: number
}

export interface GetBrowserEnvironmentStatusDto {
  environmentId: string
}

export interface DeleteBrowserEnvironmentDto {
  environmentId: string
}

// 浏览器配置文件相关的数据类型定义
export interface BrowserProfile {
  id: string
  accountId: string
  profileId: string
  environmentId?: string
  config: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface ListBrowserProfilesDto {
  accountId?: string
  profileId?: string
  environmentId?: string
  page: number
  pageSize: number
}

// MultiLogin 账号相关的数据类型定义
export interface MultiloginAccount {
  id: string
  username: string
  maxProfiles: number
  currentProfiles: number
  token?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateMultiloginAccountDto {
  username: string
  password: string
  maxProfiles?: number
}

export interface UpdateMultiloginAccountDto {
  id: string
  username?: string
  password?: string
  maxProfiles?: number
}

export interface ListMultiloginAccountsDto {
  page: number
  pageSize: number
  username?: string
  minMaxProfiles?: number
  maxMaxProfiles?: number
  hasAvailableSlots?: boolean
}

export interface IdDto {
  id: string
}

// 通用分页响应类型
export interface PaginationResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
