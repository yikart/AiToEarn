import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const ChannelAccountGroupCreateSchema = z.object({
  name: z.string().min(1).describe('分组名称'),
  rank: z.number().optional().describe('排序值'),
  ip: z.string().optional().describe('IP'),
  location: z.string().optional().describe('位置'),
  countryCode: z.string().optional().describe('国家代码'),
  proxyIp: z.string().optional().describe('代理 IP'),
  browserConfig: z.record(z.string(), z.unknown()).optional().describe('浏览器指纹配置'),
})

export class ChannelAccountGroupCreateDto extends createZodDto(ChannelAccountGroupCreateSchema) {}

export const ChannelAccountGroupUpdateSchema = ChannelAccountGroupCreateSchema.partial()

export class ChannelAccountGroupUpdateDto extends createZodDto(ChannelAccountGroupUpdateSchema) {}

export const ChannelAccountGroupDeleteQuerySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).describe('分组 ID 数组'),
})

export class ChannelAccountGroupDeleteQueryDto extends createZodDto(ChannelAccountGroupDeleteQuerySchema) {}

export const ChannelAccountGroupRankItemSchema = z.object({
  id: z.string().min(1).describe('账号 ID'),
  rank: z.number().describe('排序值'),
})

export const ChannelAccountGroupRankUpdateSchema = z.object({
  list: z.array(ChannelAccountGroupRankItemSchema).describe('排序列表'),
})

export class ChannelAccountGroupRankUpdateDto extends createZodDto(ChannelAccountGroupRankUpdateSchema) {}
