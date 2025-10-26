import { createZodDto } from '@yikart/common'
import { GenderEnum } from '@yikart/mongodb'
/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { z } from 'zod'

const ChangePasswordSchema = z.object({
  password: z.string({ message: '密码' }),
})

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}

const UpdateUserInfoSchema = z.object({
  name: z.string({ message: '昵称' }).optional(),
  avatar: z.string({ message: '头像' }).optional(),
  gender: z.nativeEnum(GenderEnum, { message: '性别' }).optional(),
  desc: z.string({ message: '简介' }).optional(),
})

export class UpdateUserInfoDto extends createZodDto(UpdateUserInfoSchema) {}
