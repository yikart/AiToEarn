import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const getTaskByOpportunityIdSchema = z.object({
  opportunityId: z.string().min(1),
})

export class GetTaskByOpportunityIdDto extends createZodDto(getTaskByOpportunityIdSchema) {}

export const getUserRewardAmountSchema = z.object({
  userId: z.string().min(1),
})

export class GetUserRewardAmountDto extends createZodDto(
  getUserRewardAmountSchema,
) {}

export const acceptTaskSchema = z.object({
  opportunityId: z.string().min(1),
  accountId: z.string().min(1).optional(),
})
export class AcceptTaskDto extends createZodDto(acceptTaskSchema) {}

export const submitTaskSchema = z.object({
  userTaskId: z.string().min(1),
  materialId: z.string().optional(),
})
export class SubmitTaskDto extends createZodDto(submitTaskSchema) {}
