// 枚举类型
export enum GenderEnum {
  MALE = 1, // 男
  FEMALE = 2, // 女
}

export enum UserStatus {
  STOP = 0,
  OPEN = 1,
  DELETE = -1,
}

export enum UserVipCycleType {
  NONE = 0, // 未认证
  MONTH = 1, // 月
  YEAR = 2, // 年
  EXPERIENCE = 3, // 体验
}

// 用户相关接口
export interface User {
  id: string
  name: string
  mail: string
  avatar?: string
  phone?: string
  wxOpenid?: string
  wxUnionid?: string
  popularizeCode?: string // 我的推广码
  inviteUserId?: string // 邀请人用户ID
  inviteCode?: string // 我填写的邀请码
  score: number // 积分字段
  status?: UserStatus
  gender?: GenderEnum
  desc?: string
}

// 基础DTO
export interface IdDto {
  id: string
}

export interface UserIdDto {
  id: string
}

export interface UserInfoDto extends UserIdDto {
  all?: boolean
}

// 用户相关DTO
export interface NewMailDto {
  mail: string
  password: string
  salt: string
  inviteCode?: string
}

export interface UserMailDto {
  mail: string
  all?: boolean
}

export interface UpdateUserInfoDto {
  id: string
  name?: string
  avatar?: string
  gender?: GenderEnum
  desc?: string
}

export interface UpdateUserStatusDto {
  id: string
  status: UserStatus
}

export interface UpdateUserPasswordDto {
  id: string
  password: string
  salt: string
}

export interface GoogleLoginDto {
  clientId: string
  credential: string
}

export interface GetUserByPopularizeCodeDto {
  code: string
}

// 积分相关DTO
export interface PointsBalanceDto {
  userId: string
}

export interface PointsRecordsDto {
  userId: string
  page: number
  pageSize: number
}

export interface AddPointsDto {
  userId: string
  amount: number
  type: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface DeductPointsDto {
  userId: string
  amount: number
  type: string
  description?: string
  metadata?: Record<string, unknown>
}

// VIP相关DTO
export interface UpdateVipInfoDto {
  id: string
  cycleType: UserVipCycleType
}

// 管理员用户相关DTO
export interface UserListQueryDto {
  keyword?: string
  status?: UserStatus
}

export interface TableDto {
  pageNo: number
  pageSize: number
}

export interface UserListDto {
  page: TableDto
  query: UserListQueryDto
}

// 返回值接口
export interface PointsBalanceVo {
  balance: number
}

export interface PointsRecordVo {
  id: string
  userId: string
  amount: number
  balance: number
  type: string
  description?: string
  metadata?: Record<string, unknown>
  createdAt: Date | string
}

export interface PointsRecordsVo {
  list: PointsRecordVo[]
  total: number
}

export interface SuccessResponse {
  success: boolean
}

// VIP 设置返回类型
export interface VipSetResponse {
  success: boolean
}

// 用户列表返回类型
export interface UserListResponse {
  list: User[]
  total: number
}
