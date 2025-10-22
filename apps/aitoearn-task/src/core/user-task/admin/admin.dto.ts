import { createZodDto } from '@yikart/common'
import { UserTaskStatus } from '@yikart/task-db'
import { z } from 'zod'

// 用户任务ID DTO
export const userTaskIdSchema = z.object({
  id: z.string().min(1),
})
export class UserTaskIdDto extends createZodDto(userTaskIdSchema) {}

// 用户任务用户ID DTO
export const userTaskUserIdSchema = userTaskIdSchema.merge(z.object({
  userId: z.string().min(1),
}))
export class UserTaskUserIdDto extends createZodDto(userTaskUserIdSchema) {}

// 用户任务过滤 DTO
export const userTaskFilterSchema = z.object({
  status: z.enum(UserTaskStatus).optional(),
  keyword: z.string().optional(),
  userId: z.string().optional(),
  opportunityId: z.string().optional(),
  taskId: z.string().optional(),
  time: z.array(z.string()).length(2).optional(),
})

export class UserTaskFilterDto extends createZodDto(userTaskFilterSchema) {}

// 管理员查询用户任务 DTO
export const adminQueryUserTaskSchema = z.object({
  filter: userTaskFilterSchema,
  page: z.object({
    pageNo: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(10),
  }),
})

export class AdminQueryUserTaskDto extends createZodDto(adminQueryUserTaskSchema) {}

// 通过任务
export const userTaskApprovedSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  screenshotUrls: z.array(z.string()).optional(),
})
export class UserTaskApprovedDto extends createZodDto(userTaskApprovedSchema) {}

// 拒绝任务 DTO
export const rejectedTaskSchema = z.object({
  id: z.string().min(1),
  rejectionReason: z.string().optional(),
  verifierUserId: z.string().min(1),
  verificationNote: z.string().optional(),
})
export class RejectedTaskDto extends createZodDto(rejectedTaskSchema) {}
