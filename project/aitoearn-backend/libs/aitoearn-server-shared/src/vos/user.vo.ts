import { createZodDto } from '@yikart/common'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// UserInfo
// ---------------------------------------------------------------------------

export const UserInfoSchema = z.object({
  id: z.string().describe('用户 ID'),
  name: z.string().describe('用户名'),
  mail: z.string().describe('邮箱'),
  avatar: z.string().optional().describe('头像 URL'),
  status: z.number().describe('用户状态'),
  isDelete: z.boolean().describe('是否删除'),
  createdAt: z.coerce.date().describe('创建时间'),
  updatedAt: z.coerce.date().describe('更新时间'),
  usedStorage: z.number().describe('已用存储空间'),
})
export interface UserInfo extends z.infer<typeof UserInfoSchema> {}

// ---------------------------------------------------------------------------
// UserInfoVo
// ---------------------------------------------------------------------------

export const UserInfoVoSchema = z.object({
  id: z.string().min(1).max(50).describe('用户ID'),
  name: z.string().min(1).max(50).describe('用户名'),
  mail: z.email().optional().describe('邮箱'),
  avatar: z.string().optional().describe('头像 URL'),
  status: z.number().describe('用户状态，0-禁用，1-启用'),
  isDelete: z.boolean().describe('是否删除'),
})
export class UserInfoVo extends createZodDto(UserInfoVoSchema, 'UserInfoVo') {}
