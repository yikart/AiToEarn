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
  mail: z.string().email().optional().describe('邮箱'),
  phone: z.string().min(1).max(20).optional().describe('手机号'),
  status: z.number().describe('用户状态，0-禁用，1-启用'),
  isDelete: z.boolean().describe('是否删除'),
  popularizeCode: z.string().min(1).max(20).optional().describe('我的推广码'),
  inviteUserId: z.string().min(1).max(50).optional().describe('邀请人用户ID'),
  inviteCode: z.string().min(1).max(20).optional().describe('我填写的邀请码'),
  score: z.number().describe('积分字段'),
  googleAccount: z
    .object({
      googleId: z.string().min(1).max(50).describe('谷歌ID'),
      email: z.string().email().describe('谷歌邮箱'),
    })
    .optional()
    .describe('谷歌账号信息'),
  vipInfo: z
    .object({
      expireTime: z.date().describe('会员过期时间'),
      status: z.number().describe('会员状态: none-无会员 trialing-试用中 monthly_once-一次性月会员 annual_once-一次性年会员 active_monthly-连续包月 active_yearly-连续包年 active_nonrenewing-有效未续购 expired-到期'),
      startTime: z.date().describe('会员开始时间'),
    })
    .optional()
    .describe('会员信息'),
  earnInfo: z
    .object({
      totalEarn: z.number().describe('总收益'),
      todayEarn: z.number().describe('今日收益'),
      yesterdayEarn: z.number().describe('昨日收益'),
    })
    .optional()
    .describe('收益信息'),

})
export class UserInfoVO extends createZodDto(UserInfoSchema) { }
