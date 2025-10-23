import { createZodDto } from '@yikart/common'
import { WithdrawRecordStatus } from '@yikart/mongodb'
import { z } from 'zod'

export const adminWithdrawListFilterSchema = z.object({
  userId: z.string().min(1).optional(),
  status: z.nativeEnum(WithdrawRecordStatus).optional(),
})
export class WithdrawListFilterDto extends createZodDto(adminWithdrawListFilterSchema) {}

export const withdrawReleaseSchema = z.object({
  desc: z.string().optional(),
  screenshotUrls: z.array(z.string()).optional(),
  status: z.nativeEnum(WithdrawRecordStatus),
})
export class WithdrawReleaseDto extends createZodDto(withdrawReleaseSchema) {}
