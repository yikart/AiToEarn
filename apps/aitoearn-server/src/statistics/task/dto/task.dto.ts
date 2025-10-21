import { createZodDto } from '@yikart/common'
import { AccountType } from '@yikart/statistics-db'
import { z } from 'zod'

export const accountIdSchema = z.object({
  accountId: z.string().min(1, { message: 'accountId is required' }),
})

export class AccountIdDto extends createZodDto(accountIdSchema) {}

export const taskIdSchema = z.object({
  taskId: z.string().min(1, { message: 'taskId is required' }),
})
export class taskIdDto extends createZodDto(taskIdSchema) {}

export const taskPostSchema = accountIdSchema
  .extend({
    taskId: z.string().min(1, { message: 'taskId is required' }),
    type: z.enum(AccountType),
    uid: z.string().min(1),
    postId: z.string().min(1),
  })

export class taskPostDto extends createZodDto(taskPostSchema) {}

export const taskPostsBatchSchema = accountIdSchema
  .extend({
    taskId: z.string().min(1, { message: 'taskId is required' }),
    platform: z.enum(AccountType),
    uid: z.string().min(1),
    postId: z.string().min(1),
  })

export class taskPostsBatchDto extends createZodDto(taskPostsBatchSchema) {}

export const postIdSchema = z.object({
  postId: z.string().min(1, { message: 'postId is required' }),
})
export class postIdDto extends createZodDto(postIdSchema) {}

export const postDetailSchema = z.object({
  postId: z.string().min(1, { message: 'postId is required' }),
  platform: z.enum(AccountType),
})
export class postDetailDto extends createZodDto(postDetailSchema) {}
