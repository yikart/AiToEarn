import { createZodDto, TableDtoSchema } from '@yikart/common'
import { z } from 'zod'

const getAppConfigSchema = z.object({
  appId: z.string().describe('应用ID'),
})
export class GetAppConfigDto extends createZodDto(getAppConfigSchema) {}

const updateConfigSchema = z.object({
  appId: z.string().describe('应用ID'),
  key: z.string().describe('配置键'),
  value: z.any().describe('配置值'),
  description: z.string().optional().describe('配置描述'),
  metadata: z.record(z.string(), z.any()).optional().describe('元数据'),
})
export class UpdateConfigDto extends createZodDto(updateConfigSchema) {}

// 批量更新配置
const updateConfigsSchema = z.object({
  appId: z.string().describe('应用ID'),
  configs: z.array(updateConfigSchema).describe('配置列表'),
})
export class UpdateConfigsDto extends createZodDto(updateConfigsSchema) {}

// 删除配置
const deleteConfigSchema = z.object({
  appId: z.string().describe('应用ID'),
  key: z.string().describe('配置键'),
})
export class DeleteConfigDto extends createZodDto(deleteConfigSchema) {}

const appConfigListFilterSchema = z.object({
  appId: z.string().optional().describe('应用ID'),
  key: z.string().optional().describe('key'),
})
const appConfigListSchema = z.object({
  filter: appConfigListFilterSchema,
  page: TableDtoSchema,
})
export class AppConfigListDto extends createZodDto(appConfigListSchema) {}
