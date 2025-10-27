import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const CreateSkKeySchema = z.object({
  desc: z.string({ message: '备注' }).optional(),
})
export class CreateSkKeyDto extends createZodDto(CreateSkKeySchema) { }

const SkKeyUpInfoSchema = z.object({
  key: z.string({ message: 'key' }),
  desc: z.string({ message: '备注' }),
})
export class SkKeyUpInfoDto extends createZodDto(SkKeyUpInfoSchema) { }

const SkKeyAddRefAccountSchema = z.object({
  key: z.string({ message: 'key' }),
  accountId: z.string({ message: '账号ID' }),
})
export class SkKeyAddRefAccountDto extends createZodDto(SkKeyAddRefAccountSchema) { }

const GetRefAccountListSchema = z.object({
  key: z.string({ message: 'key' }),
})
export class GetRefAccountListDto extends createZodDto(GetRefAccountListSchema) { }
