import { createZodDto } from '@yikart/common'
import z, { email } from 'zod'

export const GenAuthURLSchema = z.object({
  platform: z.string().describe('平台类型'),
  spaceId: z.string().describe('空间ID'),
  type: z.string().optional().describe('授权类型，部分平台需要'),
  prefix: z.string().optional().describe('前缀，部分平台需要'),
  email: email().optional().describe('邮箱，部分平台需要'),
  userId: z.string().describe('用户ID'),
  scopes: z.array(z.string()).optional().describe('权限范围，部分平台需要'),
})

export class GenAuthURLDto extends createZodDto(
  GenAuthURLSchema,
) {}
