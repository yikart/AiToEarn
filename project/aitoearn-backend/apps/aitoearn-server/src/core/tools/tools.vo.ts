import { createPaginationVo, createZodDto } from '@yikart/common'
import { z } from 'zod'

export const QrCodeArtVoSchema = z.object({
  logId: z.string().describe('异步任务日志 ID'),
  status: z.string().describe('任务状态'),
})

export class QrCodeArtVo extends createZodDto(QrCodeArtVoSchema, 'QrCodeArtVo') {}

export const QrCodeArtImageVoSchema = z.object({
  id: z.string().describe('图片 ID'),
  relId: z.string().describe('关联的数据 ID'),
  relType: z.string().describe('关联的数据类型'),
  logId: z.string().describe('AI 任务日志 ID'),
  content: z.string().describe('二维码内容'),
  referenceImageUrl: z.string().optional().describe('参考样式图 URL'),
  prompt: z.string().describe('提示词'),
  model: z.string().describe('使用的模型'),
  size: z.string().optional().describe('图片尺寸'),
  status: z.string().describe('任务状态'),
  imageUrl: z.string().optional().describe('生成的二维码艺术图 URL'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class QrCodeArtImageVo extends createZodDto(QrCodeArtImageVoSchema, 'QrCodeArtImageVo') {}

export class QrCodeArtImageListVo extends createPaginationVo(QrCodeArtImageVoSchema, 'QrCodeArtImageListVo') {}

const imageObjectSchema = z.object({
  url: z.string().optional().describe('图片 URL'),
  b64_json: z.string().optional().describe('base64 编码的图片'),
  revised_prompt: z.string().optional().describe('修订后的提示词'),
})

export const QrCodeArtTaskStatusVoSchema = z.object({
  logId: z.string().describe('任务日志 ID'),
  status: z.string().describe('任务状态'),
  startedAt: z.coerce.date().describe('开始时间'),
  duration: z.number().optional().describe('持续时间（毫秒）'),
  points: z.number().describe('消耗 Credits'),
  images: z.array(imageObjectSchema).optional().describe('生成的图片列表'),
  errorMessage: z.string().optional().describe('错误信息'),
  createdAt: z.coerce.date().describe('创建时间'),
  updatedAt: z.coerce.date().describe('更新时间'),
})

export class QrCodeArtTaskStatusVo extends createZodDto(QrCodeArtTaskStatusVoSchema, 'QrCodeArtTaskStatusVo') {}
