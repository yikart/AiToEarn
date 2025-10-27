import { createZodDto } from '@yikart/common'
import z from 'zod'

const CreateAccountGroupSchema = z.object({
  name: z.string({ message: '组名称' }),
  rank: z.number().optional(),
  ip: z.string().optional(),
  location: z.string().optional(),
  proxyIp: z.string().optional(),
  browserConfig: z.record(z.string(), z.any()).optional(),
})

export class CreateAccountGroupDto extends createZodDto(CreateAccountGroupSchema) {}

const UpdateAccountGroupSchema = z.object({
  id: z.string({ message: '更新ID' }),
  name: z.string({ message: '组名称' }).optional(),
  rank: z.number().optional(),
  ip: z.string().optional(),
  location: z.string().optional(),
  proxyIp: z.string().optional(),
  browserConfig: z.record(z.string(), z.any()).optional(),
})

export class UpdateAccountGroupDto extends createZodDto(UpdateAccountGroupSchema) {}

const DeleteAccountGroupSchema = z.object({
  ids: z.array(z.string({ message: 'ID' })),
})

export class DeleteAccountGroupDto extends createZodDto(DeleteAccountGroupSchema) {}

export const SortRankItemSchema = z.object({
  id: z.string({ message: '数据ID' }),
  rank: z.number({ message: '序号' }),
})

export const SortRankSchema = z.object({
  list: z.array(SortRankItemSchema),
})
export class SortRankDto extends createZodDto(SortRankSchema) {}
