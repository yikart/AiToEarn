import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const RedNoteOfflineQrVerifyConfigSchema = z.object({
  appKey: z.string().describe('小红书 App Key'),
  nonce: z.string().describe('nonce'),
  timestamp: z.string().describe('时间戳'),
  signature: z.string().describe('签名'),
})

export const RedNoteOfflineQrShareConfigVoSchema = z.object({
  verifyConfig: RedNoteOfflineQrVerifyConfigSchema.describe('小红书分享校验配置'),
})

export class RedNoteOfflineQrShareConfigVo extends createZodDto(
  RedNoteOfflineQrShareConfigVoSchema,
  'RedNoteOfflineQrShareConfigVo',
) {}
