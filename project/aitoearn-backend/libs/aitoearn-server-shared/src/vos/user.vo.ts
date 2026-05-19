import { createZodDto, VipStatus, VipTier } from '@yikart/common'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// UserVipInfo
// ---------------------------------------------------------------------------

export const UserVipInfoSchema = z.object({
  tier: z.enum(VipTier).describe('会员档位'),
  status: z.enum(VipStatus).describe('会员状态'),
  startAt: z.coerce.date().describe('会员开始时间'),
  expireAt: z.coerce.date().describe('会员过期时间'),
})
export interface UserVipInfo extends z.infer<typeof UserVipInfoSchema> {}

// ---------------------------------------------------------------------------
// UserStorage
// ---------------------------------------------------------------------------

export const UserStorageSchema = z.object({
  total: z.number().describe('总存储空间（字节）'),
  expiredAt: z.coerce.date().optional().describe('过期时间'),
})
export interface UserStorage extends z.infer<typeof UserStorageSchema> {}

// ---------------------------------------------------------------------------
// UserInfo
// ---------------------------------------------------------------------------

export const UserInfoSchema = z.object({
  id: z.string().describe('用户 ID'),
  name: z.string().describe('用户名'),
  mail: z.string().describe('邮箱'),
  phone: z.string().optional().describe('手机号'),
  avatar: z.string().optional().describe('头像 URL'),
  status: z.number().describe('用户状态'),
  isDelete: z.boolean().describe('是否删除'),
  googleAccount: z.record(z.string(), z.unknown()).optional().describe('谷歌账号信息'),
  vipInfo: UserVipInfoSchema.optional().describe('会员信息'),
  createdAt: z.coerce.date().describe('创建时间'),
  updatedAt: z.coerce.date().describe('更新时间'),
  usedStorage: z.number().describe('已用存储空间'),
  storage: UserStorageSchema.describe('存储信息'),
})
export interface UserInfo extends z.infer<typeof UserInfoSchema> {}

// ---------------------------------------------------------------------------
// UserInfoVo
// ---------------------------------------------------------------------------

export const UserInfoVoSchema = z.object({
  id: z.string().min(1).max(50).describe('用户ID'),
  name: z.string().min(1).max(50).describe('用户名'),
  mail: z.email().optional().describe('邮箱'),
  phone: z.string().min(1).max(20).optional().describe('手机号'),
  status: z.number().describe('用户状态，0-禁用，1-启用'),
  isDelete: z.boolean().describe('是否删除'),
  googleAccount: z
    .object({
      googleId: z.string().min(1).max(50).describe('谷歌ID'),
      email: z.email().describe('谷歌邮箱'),
    })
    .optional()
    .describe('谷歌账号信息'),
  vipInfo: z
    .object({
      tier: z.enum(VipTier).describe('会员档位'),
      status: z.enum(VipStatus).describe('会员状态'),
      startAt: z.date().describe('会员开始时间'),
      expireAt: z.date().describe('会员过期时间'),
    })
    .optional()
    .describe('会员信息'),
})
export class UserInfoVo extends createZodDto(UserInfoVoSchema, 'UserInfoVo') {}
