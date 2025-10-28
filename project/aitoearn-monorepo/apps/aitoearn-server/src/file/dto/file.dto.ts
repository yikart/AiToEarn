import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const InitMultipartUploadSchema = z.object({
  fileName: z.string().describe('文件名称'),
  secondPath: z.string().describe('存放位置'),
  fileSize: z.string().describe('文件大小'),
  contentType: z.string().describe('文件类型'),
})
export class InitMultipartUploadDto extends createZodDto(InitMultipartUploadSchema) {}

export const UploadPartSchema = z.object({
  fileId: z.string().describe('文件key'),
  uploadId: z.string().describe('上传ID'),
  partNumber: z.number().describe('分片索引'),
})
export class UploadPartDto extends createZodDto(UploadPartSchema) {}

export const CompletePartSchema = z.object({
  fileId: z.string().describe('文件key'),
  uploadId: z.string().describe('上传ID'),
  parts: z.array(z.object({
    PartNumber: z.number(),
    ETag: z.string(),
  })).describe('分片'),
})
export class CompletePartDto extends createZodDto(CompletePartSchema) {}

const getUploadUrlSchema = z.object({
  key: z.string().describe('文件名'),
})
export class GetUploadUrlDto extends createZodDto(getUploadUrlSchema) {}

const getUploadPartUrlSchema = z.object({
  key: z.string().describe('文件名'),
  uploadId: z.string().describe('上传ID'),
  partNumber: z.number().describe('分片序号'),
  expiresIn: z.number().optional().describe('过期时间'),
})
export class GetUploadPartUrlUrlDto extends createZodDto(getUploadPartUrlSchema) {}
