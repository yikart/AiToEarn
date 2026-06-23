import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const RedNoteOfflineQrShareConfigSchema = z.object({
  nonce: z.string().trim().min(1).max(64).optional().describe('可选 nonce；不传时服务端自动生成'),
})

export class RedNoteOfflineQrShareConfigDto extends createZodDto(
  RedNoteOfflineQrShareConfigSchema,
  'RedNoteOfflineQrShareConfigDto',
) {}
