import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

export const getTaskSchema = z.object({
  id: z.string().min(1),
})

export class GetTaskDto extends createZodDto(getTaskSchema) {}

export const getUserRewardAmountSchema = z.object({
  userId: z.string().min(1),
})

export class GetUserRewardAmountDto extends createZodDto(
  getUserRewardAmountSchema,
) {}

export const acceptTaskSchema = z.object({
  taskId: z.string().min(1),
  accountType: z.string().min(1),
  uid: z.string().min(1),
  account: z.string().min(1),
})

export class AcceptTaskDto extends createZodDto(acceptTaskSchema) {}
