import { createZodDto } from '@yikart/common'
import { GenderEnum, UserType } from '@yikart/mongodb'
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
  gender: z.enum(GenderEnum, { message: '性别' }).optional(),
  desc: z.string({ message: '简介' }).optional(),
})

export class UpdateUserInfoDto extends createZodDto(UpdateUserInfoSchema) {}

export const SetAiConfigSchema = z.object({
  image: z.object({
    defaultModel: z.string(),
    option: z.record(z.string(), z.any()).optional(),
  }),
  edit: z.object({
    defaultModel: z.string(),
    option: z.record(z.string(), z.any()).optional(),
  }),
  video: z.object({
    defaultModel: z.string(),
    option: z.record(z.string(), z.any()).optional(),
  }),
  agent: z.object({
    defaultModel: z.string(),
    option: z.record(z.string(), z.any()).optional(),
  }),
})
export class SetAiConfigDto extends createZodDto(SetAiConfigSchema) {}

export const SetAiConfigItemSchema = z.object({
  type: z.enum(['image', 'edit', 'video', 'agent']),
  value: z.object({
    defaultModel: z.string(),
    option: z.record(z.string(), z.any()).optional(),
  }),
})
export class SetAiConfigItemDto extends createZodDto(SetAiConfigItemSchema) {}

export const ReportLocationDtoSchema = z.object({
  lat: z.number().describe('纬度'),
  lng: z.number().describe('经度'),
  country: z.string().optional().describe('国家名称'),
  countryCode: z.string().optional().describe('国家代码'),
  city: z.string().optional().describe('城市名称'),
  cityCode: z.string().optional().describe('城市代码'),
  district: z.string().optional().describe('区/县名称'),
  districtCode: z.string().optional().describe('区/县代码'),
})
export class ReportLocationDto extends createZodDto(ReportLocationDtoSchema, 'ReportLocationDto') {}

export const UpdateLocaleDtoSchema = z.object({
  locale: z
    .enum(['en-US', 'zh-CN'])
    .describe('语言偏好'),
})
export class UpdateLocaleDto extends createZodDto(
  UpdateLocaleDtoSchema,
  'UpdateLocaleDto',
) {}

export const SwitchUserTypeDtoSchema = z.object({
  userType: z
    .enum([UserType.CREATOR, UserType.BUSINESS_OWNER])
    .describe('目标用户类型'),
})
export class SwitchUserTypeDto extends createZodDto(
  SwitchUserTypeDtoSchema,
  'SwitchUserTypeDto',
) {}
