import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const GetUserTokenSchema = z.object({
  userId: z.string(),
})
export class GetUserTokenDto extends createZodDto(GetUserTokenSchema) {}
