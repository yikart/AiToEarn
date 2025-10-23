import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { CloudSpaceRegion, CloudSpaceStatus } from '@yikart/mongodb'
import { z } from 'zod'

// 云空间列表查询 DTO
export const ListCloudSpacesSchema = z.object({
  ...PaginationDtoSchema.shape,
  userId: z.string().optional().describe('用户ID'),
  region: z.enum(CloudSpaceRegion).optional().describe('区域筛选'),
  status: z.enum(CloudSpaceStatus).optional().describe('状态筛选'),
})

export class ListCloudSpacesDto extends createZodDto(ListCloudSpacesSchema, 'ListCloudSpacesDto') {}

// 浏览器配置文件列表查询 DTO
export const ListBrowserProfilesSchema = z.object({
  ...PaginationDtoSchema.shape,
  accountId: z.string().optional().describe('账号ID'),
  profileId: z.string().optional().describe('配置文件ID'),
  cloudSpaceId: z.string().optional().describe('云空间ID'),
})

export class ListBrowserProfilesDto extends createZodDto(ListBrowserProfilesSchema, 'ListBrowserProfilesDto') {}

// Multilogin账号列表查询 DTO
export const ListMultiloginAccountsSchema = z.object({
  ...PaginationDtoSchema.shape,
  email: z.string().optional().describe('用户名'),
  minMaxProfiles: z.number().optional().describe('最小最大配置文件数'),
  maxMaxProfiles: z.number().optional().describe('最大最大配置文件数'),
  hasAvailableSlots: z.boolean().optional().describe('是否有可用槽位'),
})

export class ListMultiloginAccountsDto extends createZodDto(ListMultiloginAccountsSchema, 'ListMultiloginAccountsDto') {}

// Multilogin账号 DTO
export const CreateMultiloginAccountSchema = z.object({
  email: z.string().describe('用户名'),
  password: z.string().describe('密码'),
  maxProfiles: z.number().optional().describe('最大配置文件数'),
})

export class CreateMultiloginAccountDto extends createZodDto(CreateMultiloginAccountSchema, 'CreateMultiloginAccountDto') {}

// 更新Multilogin账号 DTO
export const UpdateMultiloginAccountSchema = z.object({
  id: z.string().describe('账号ID'),
  email: z.string().optional().describe('用户名'),
  password: z.string().optional().describe('密码'),
  maxProfiles: z.number().optional().describe('最大配置文件数'),
})

export class UpdateMultiloginAccountDto extends createZodDto(UpdateMultiloginAccountSchema, 'UpdateMultiloginAccountDto') {}
