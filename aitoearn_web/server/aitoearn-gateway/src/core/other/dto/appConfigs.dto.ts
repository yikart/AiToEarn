import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

export const getAppConfigListSchema = z.object({
  appId: z.string().min(1),
})
export class GetAppConfigListDto extends createZodDto(
  getAppConfigListSchema,
) {}
