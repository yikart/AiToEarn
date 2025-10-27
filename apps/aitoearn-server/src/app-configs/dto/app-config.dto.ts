import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const getAppConfigListSchema = z.object({
  appId: z.string().min(1),
})
export class GetAppConfigListDto extends createZodDto(
  getAppConfigListSchema,
) {}
