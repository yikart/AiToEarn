import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const GetAuthUrlSchema = z.object({
  scopes: z.array(z.string()).optional(),
  spaceId: z.string().optional(),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

const GetAuthInfoSchema = z.object({
  taskId: z.string({ message: '任务ID不能为空' }),
})
export class GetAuthInfoDto extends createZodDto(GetAuthInfoSchema) {}

const CreateAccountAndSetAccessTokenSchema = z.object({
  code: z.string({ message: '授权码不能为空' }),
  state: z.string({ message: '状态码不能为空' }),
})
export class CreateAccountAndSetAccessTokenDto extends createZodDto(CreateAccountAndSetAccessTokenSchema) {}
