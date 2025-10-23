import { createPaginationVo, createZodDto } from '@yikart/common'
import { CloudSpaceRegion, CloudSpaceStatus } from '@yikart/mongodb'
import { z } from 'zod'

// 云空间状态 VO
export const CloudSpaceStatusVoSchema = z.object({
  id: z.string().describe('云空间ID'),
  status: z.enum(CloudSpaceStatus).describe('云空间状态'),
  message: z.string().optional().describe('状态消息'),
  updatedAt: z.date().or(z.string()).describe('更新时间'),
})

export class CloudSpaceStatusVo extends createZodDto(CloudSpaceStatusVoSchema) {}

// 云空间详情 VO
export const CloudSpaceVoSchema = z.object({
  id: z.string().describe('云空间ID'),
  userId: z.string().describe('用户ID'),
  instanceId: z.string().describe('实例ID'),
  region: z.enum(CloudSpaceRegion).describe('云空间区域'),
  status: z.enum(CloudSpaceStatus).describe('云空间状态'),
  ip: z.string().describe('IP地址'),
  password: z.string().optional().describe('密码'),
  expiredAt: z.date().or(z.string()).describe('过期时间'),
  createdAt: z.date().or(z.string()).describe('创建时间'),
  updatedAt: z.date().or(z.string()).describe('更新时间'),
  remoteUrl: z.string().optional(),
})

export class CloudSpaceVo extends createZodDto(CloudSpaceVoSchema) {}

export class CloudSpaceListVo extends createPaginationVo(CloudSpaceVoSchema, 'CloudSpaceListVo') {}

// 浏览器配置文件 VO
export const BrowserProfileVoSchema = z.object({
  id: z.string().describe('配置文件ID'),
  accountId: z.string().describe('账号ID'),
  profileId: z.string().describe('配置文件ID'),
  cloudSpaceId: z.string().optional().describe('云空间ID'),
  config: z.record(z.string(), z.unknown()).describe('配置信息'),
  createdAt: z.date().or(z.string()).describe('创建时间'),
  updatedAt: z.date().or(z.string()).describe('更新时间'),
})

export class BrowserProfileVo extends createZodDto(BrowserProfileVoSchema) {}

export class BrowserProfileListVo extends createPaginationVo(BrowserProfileVoSchema, 'BrowserProfileListVo') {}

// Multilogin账号 VO
export const MultiloginAccountVoSchema = z.object({
  id: z.string().describe('账号ID'),
  email: z.string().describe('用户名'),
  password: z.string().describe('密码'),
  maxProfiles: z.number().describe('最大配置文件数'),
  currentProfiles: z.number().describe('当前配置文件数'),
  token: z.string().optional().describe('令牌'),
  createdAt: z.date().or(z.string()).describe('创建时间'),
  updatedAt: z.date().or(z.string()).describe('更新时间'),
})

export class MultiloginAccountVo extends createZodDto(MultiloginAccountVoSchema) {}

export class MultiloginAccountListVo extends createPaginationVo(MultiloginAccountVoSchema, 'MultiloginAccountListVo') {}
