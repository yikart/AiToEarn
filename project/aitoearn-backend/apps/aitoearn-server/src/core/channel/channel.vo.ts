import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'

const WorkDetailVoSchema = z.object({
  dataId: z.string().describe('作品数据 ID'),
  title: z.string().optional().describe('作品标题'),
  desc: z.string().optional().describe('作品描述'),
  topics: z.array(z.string()).default([]).describe('作品话题标签'),
  coverUrl: z.string().optional().describe('作品封面 URL'),
  videoUrl: z.string().optional().describe('作品视频 URL'),
  imgUrlList: z.array(z.string()).default([]).describe('作品图片 URL 列表'),
  publishTime: z.date().optional().describe('作品发布时间'),
  type: z.string().describe('作品类型'),
  videoType: z.enum(['short', 'long']).optional().describe('视频长短类型'),
  duration: z.number().optional().describe('视频时长（秒）'),
})

export const ValidateWorkOwnershipVoSchema = z.object({
  accountId: z.string().describe('账号 ID'),
  accountType: z.enum(AccountType).describe('平台类型'),
  authorizationStatus: z.enum(['valid']).describe('授权状态'),
  ownershipVerified: z.boolean().describe('作品归属校验结果'),
  dataId: z.string().describe('作品数据 ID'),
  uniqueId: z.string().describe('作品唯一 ID'),
  resolvedWorkLink: z.string().optional().describe('解析后的作品链接'),
  type: z.string().describe('作品类型'),
  videoType: z.enum(['short', 'long']).optional().describe('视频长短类型'),
  workDetail: WorkDetailVoSchema.optional().describe('作品详情'),
})

export class ValidateWorkOwnershipVo extends createZodDto(
  ValidateWorkOwnershipVoSchema,
  'ValidateWorkOwnershipVo',
) {}
