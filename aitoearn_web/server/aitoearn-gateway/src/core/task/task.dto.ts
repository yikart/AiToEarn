import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

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
})

export class AcceptTaskDto extends createZodDto(acceptTaskSchema) {}
