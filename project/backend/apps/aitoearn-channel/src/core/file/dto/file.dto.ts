/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: 反馈
 */
import { createZodDto } from '@yikart/common'
import z from 'zod'

const InitMultipartUploadSchema = z.object({
  fileName: z.string({ message: '文件名称' }),
  secondPath: z.string({ message: '存放位置' }),
  fileSize: z.string({ message: '文件大小' }),
  contentType: z.string({ message: '文件类型' }),
})
export class InitMultipartUploadDto extends createZodDto(InitMultipartUploadSchema) {}

const UploadPartSchema = z.object({
  fileId: z.string({ message: '文件key' }),
  uploadId: z.string({ message: '上传ID' }),
  partNumber: z.number({ message: '分片索引' }),
})
export class UploadPartDto extends createZodDto(UploadPartSchema) {}

const CompletePartSchema = z.object({
  fileId: z.string({ message: '文件key' }),
  uploadId: z.string({ message: '上传ID' }),
  parts: z.array(
    z.object({
      PartNumber: z.number(),
      ETag: z.string(),
    }),
  ).describe('分片'),
})
export class CompletePartDto extends createZodDto(CompletePartSchema) {}
