import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const CreateSkKeySchema = z.object({
  userId: z.string().describe('用户ID'),
  desc: z.string().describe('描述').optional(),
})
export class CreateSkKeyDto extends createZodDto(CreateSkKeySchema) {}

export const SkKeyKeySchema = z.object({
  key: z.string().describe('key'),
})
export class SkKeyKeyDto extends createZodDto(SkKeyKeySchema) {}

export const UpSkKeyInfoSchema = z.object({
  key: z.string().describe('key'),
  desc: z.string().describe('描述'),
})
export class UpSkKeyInfoDto extends createZodDto(UpSkKeyInfoSchema) {}

export const GetSkKeyListSchema = z.object({
  userId: z.string().describe('用户ID'),
  pageNo: z.number().default(1),
  pageSize: z.number().default(10),
})
export class GetSkKeyListDto extends createZodDto(GetSkKeyListSchema) {}

export const AddRefAccountSchema = z.object({
  key: z.string().describe('key'),
  accountId: z.string().describe('账号ID'),
})
export class AddRefAccountDto extends createZodDto(AddRefAccountSchema) {}

export const GetRefAccountListSchema = z.object({
  key: z.string().describe('key'),
  pageNo: z.number().default(1),
  pageSize: z.number().default(10),
})
export class GetRefAccountListDto extends createZodDto(GetRefAccountListSchema) {}
