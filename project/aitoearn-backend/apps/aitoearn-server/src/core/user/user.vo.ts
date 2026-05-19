/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { createZodDto } from '@yikart/common'
import z from 'zod'

const UserInfoSchema = z.object({
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
})
export class UserInfoVO extends createZodDto(UserInfoSchema) { }
