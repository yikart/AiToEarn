import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { z } from 'zod'

export const GenerateQrCodeArtDtoSchema = z.object({
  content: z.string().min(1).max(2000).describe('二维码扫码后的内容'),
  referenceImageUrl: z.url().optional().describe('参考样式图 URL'),
  prompt: z.string().min(1).max(4000).describe('文字描述（提示词）'),
  model: z.string().default('gpt-image-1').describe('图片生成模型'),
  size: z.string().optional().describe('图片尺寸'),
})

export class GenerateQrCodeArtDto extends createZodDto(GenerateQrCodeArtDtoSchema, 'GenerateQrCodeArtDto') {}

export const CreateQrCodeArtImageDtoSchema = z.object({
  relId: z.string().min(1).describe('关联的数据 ID'),
  relType: z.string().min(1).describe('关联的数据类型'),
  logId: z.string().min(1).describe('AI 任务日志 ID'),
  content: z.string().min(1).max(2000).describe('二维码扫码后的内容'),
  referenceImageUrl: z.url().optional().describe('参考样式图 URL'),
  prompt: z.string().min(1).max(4000).describe('文字描述（提示词）'),
  model: z.string().describe('图片生成模型'),
  size: z.string().optional().describe('图片尺寸'),
  status: z.string().describe('任务状态'),
  imageUrl: z.url().optional().describe('生成的二维码艺术图 URL'),
})

export class CreateQrCodeArtImageDto extends createZodDto(CreateQrCodeArtImageDtoSchema, 'CreateQrCodeArtImageDto') {}

export const ListQrCodeArtImagesDtoSchema = PaginationDtoSchema.extend({
  relId: z.string().min(1).describe('关联的数据 ID'),
  relType: z.string().min(1).describe('关联的数据类型'),
})

export class ListQrCodeArtImagesDto extends createZodDto(ListQrCodeArtImagesDtoSchema, 'ListQrCodeArtImagesDto') {}

export const GetQrCodeArtTaskStatusDtoSchema = z.object({
  logId: z.string().min(1).describe('异步任务日志 ID'),
})

export class GetQrCodeArtTaskStatusDto extends createZodDto(GetQrCodeArtTaskStatusDtoSchema, 'GetQrCodeArtTaskStatusDto') {}
