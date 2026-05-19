import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const ValidateWorkOwnershipSchema = z.object({
  accountId: z.string().min(1).describe('账号 ID'),
  workLink: z.string().url().describe('作品链接'),
})

export class ValidateWorkOwnershipDto extends createZodDto(
  ValidateWorkOwnershipSchema,
  'ValidateWorkOwnershipDto',
) {}
