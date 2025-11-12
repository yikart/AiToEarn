import { createZodDto } from '@yikart/common'
import z from 'zod'

const CreateAccountGroupSchema = z.object({
  name: z.string({ message: 'name' }),
  rank: z.number().optional(),
  ip: z.string().optional(),
  location: z.string().optional(),
  countryCode: z.string().optional(),
  proxyIp: z.string().optional(),
  browserConfig: z.record(z.string(), z.any()).optional(),
})

export class CreateAccountGroupDto extends createZodDto(CreateAccountGroupSchema) {}

const UpdateAccountGroupSchema = z.object({
  id: z.string({ message: 'ID' }),
  name: z.string({ message: 'name' }).optional(),
  rank: z.number().optional(),
  ip: z.string().optional(),
  location: z.string().optional(),
  countryCode: z.string().optional(),
  proxyIp: z.string().optional(),
  browserConfig: z.record(z.string(), z.any()).optional(),
})

export class UpdateAccountGroupDto extends createZodDto(UpdateAccountGroupSchema) {}

const DeleteAccountGroupSchema = z.object({
  ids: z.array(z.string({ message: 'ID' })),
})

export class DeleteAccountGroupDto extends createZodDto(DeleteAccountGroupSchema) {}

export const SortRankItemSchema = z.object({
  id: z.string({ message: 'ID' }),
  rank: z.number({ message: 'rank' }),
})

export const SortRankSchema = z.object({
  list: z.array(SortRankItemSchema),
})
export class SortRankDto extends createZodDto(SortRankSchema) {}
