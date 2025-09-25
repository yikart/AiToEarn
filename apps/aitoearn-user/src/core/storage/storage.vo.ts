import { createZodDto } from '@yikart/common'
import { z } from 'zod'

// 用户存储信息 VO
export const storageInfoVoSchema = z.object({
  used: z.number().describe('已用存储（Bytes）'),
  total: z.number().describe('总存储容量（Bytes）'),
  available: z.number().describe('可用存储（Bytes）'),
})

export class StorageInfoVo extends createZodDto(storageInfoVoSchema) {}
