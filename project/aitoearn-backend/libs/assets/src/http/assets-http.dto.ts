import { createZodDto } from '@yikart/common'
import { AssetType } from '@yikart/mongodb'
import { z } from 'zod'

const createUploadSignSchema = z.object({
  filename: z.string().describe('文件名（带扩展名）'),
  type: z.enum(AssetType).default(AssetType.Temp).describe('资源类型'),
  size: z.number().optional().describe('文件大小（字节）'),
})
export class CreateUploadSignDto extends createZodDto(createUploadSignSchema) {}

const getThumbnailQuerySchema = z.object({
  url: z.string().describe('视频 URL（CDN URL 或 path）'),
  timeInSeconds: z.coerce.number().min(0).default(1).describe('提取帧的时间点（秒），默认 1 秒'),
  redirect: z.coerce.boolean().default(false).describe('是否直接重定向到封面 URL，默认 false'),
})
export class GetThumbnailQueryDto extends createZodDto(getThumbnailQuerySchema) {}

const ossCallbackDtoSchema = z.object({
  object: z.string().describe('OSS 对象路径'),
  size: z.coerce.number().describe('文件大小'),
  mimeType: z.string().describe('MIME 类型'),
  assetId: z.string().describe('资产 ID'),
})
export class OssCallbackDto extends createZodDto(ossCallbackDtoSchema, 'OssCallbackDto') {}
