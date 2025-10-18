import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { AppPlatform } from '@yikart/mongodb'
import { z } from 'zod'

// 版本链接 Schema
export const appReleaseLinksSchema = z.object({
  store: z.string().optional().describe('商店链接'),
  direct: z.string().describe('直接下载链接'),
})
// 检查版本 DTO Schema
const checkVersionDtoSchema = z.object({
  platform: z.enum(AppPlatform).describe('平台'),
  currentVersion: z.string().describe('当前版本号'),
  currentBuildNumber: z.number().optional().describe('当前构建号'),
})

export class CheckVersionDto extends createZodDto(checkVersionDtoSchema) {}

// 查询版本发布列表 DTO Schema（管理端）
const queryAppReleaseDtoSchema = z.object({
  platform: z.enum(AppPlatform).optional().describe('平台筛选'),
  ...PaginationDtoSchema.shape,
})

export class QueryAppReleaseDto extends createZodDto(queryAppReleaseDtoSchema) {}

// 创建版本发布 DTO Schema
const createAppReleaseDtoSchema = z.object({
  platform: z.enum(AppPlatform).describe('平台'),
  version: z.string().describe('版本号'),
  buildNumber: z.number().describe('构建号'),
  forceUpdate: z.boolean().describe('是否强制更新'),
  notes: z.string().describe('版本说明'),
  links: appReleaseLinksSchema.describe('版本链接'),
  publishedAt: z.iso.datetime().describe('发布时间'),
})

export class CreateAppReleaseDto extends createZodDto(createAppReleaseDtoSchema) {}

// 更新版本发布 DTO Schema
const updateAppReleaseDtoSchema = z.object({
  platform: z.enum(AppPlatform).optional().describe('平台'),
  version: z.string().optional().describe('版本号'),
  buildNumber: z.number().optional().describe('构建号'),
  forceUpdate: z.boolean().optional().describe('是否强制更新'),
  notes: z.string().optional().describe('版本说明'),
  links: appReleaseLinksSchema.optional().describe('版本链接'),
  publishedAt: z.iso.datetime().optional().describe('发布时间'),
})

export class UpdateAppReleaseDto extends createZodDto(updateAppReleaseDtoSchema) {}

// 获取版本发布详情 DTO Schema
const getAppReleaseByIdDtoSchema = z.object({
  id: z.string().describe('版本发布ID'),
})

export class GetAppReleaseByIdDto extends createZodDto(getAppReleaseByIdDtoSchema) {}

// 删除版本发布 DTO Schema
const deleteAppReleaseDtoSchema = z.object({
  id: z.string().describe('版本发布ID'),
})

export class DeleteAppReleaseDto extends createZodDto(deleteAppReleaseDtoSchema) {}
