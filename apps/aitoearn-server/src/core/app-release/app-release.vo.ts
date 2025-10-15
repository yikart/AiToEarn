import { createPaginationVo, createZodDto } from '@yikart/common'
import { AppPlatform } from '@yikart/mongodb'
import { z } from 'zod'
import { appReleaseLinksSchema } from './app-release.dto'

// 版本发布信息 VO Schema
const appReleaseVoSchema = z.object({
  id: z.string().describe('版本发布ID'),
  platform: z.enum(AppPlatform).describe('平台'),
  version: z.string().describe('版本号'),
  buildNumber: z.number().describe('构建号'),
  forceUpdate: z.boolean().describe('是否强制更新'),
  notes: z.string().describe('版本说明'),
  links: appReleaseLinksSchema.describe('版本链接'),
  publishedAt: z.date().describe('发布时间'),
  createdAt: z.date().optional().describe('创建时间'),
  updatedAt: z.date().optional().describe('更新时间'),
})

export class AppReleaseVo extends createZodDto(appReleaseVoSchema) {}

// 版本检查结果 VO Schema
const checkVersionVoSchema = z.object({
  hasUpdate: z.boolean().describe('是否有更新'),
  forceUpdate: z.boolean().describe('是否强制更新'),
  latestVersion: z.string().optional().describe('最新版本号'),
  currentVersion: z.string().describe('当前版本号'),
  latestBuildNumber: z.number().describe('构建号'),
  currentBuildNumber: z.number().describe('构建号'),
  notes: z.string().optional().describe('版本说明'),
  links: appReleaseLinksSchema.optional().describe('版本链接'),
  publishedAt: z.date().optional().describe('发布时间'),
})

export class CheckVersionVo extends createZodDto(checkVersionVoSchema) {}

// 版本发布列表 VO (使用分页)
export class AppReleaseListVo extends createPaginationVo(appReleaseVoSchema, 'AppReleaseListVo') {}
