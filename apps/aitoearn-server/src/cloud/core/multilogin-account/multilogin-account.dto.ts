import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import z from 'zod'

export const CreateMultiloginAccountDtoSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  maxProfiles: z.number().int().min(1).default(10),
})

export class CreateMultiloginAccountDto extends createZodDto(CreateMultiloginAccountDtoSchema) {}

export const UpdateMultiloginAccountDtoSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  maxProfiles: z.number().int().min(1).optional(),
})

export class UpdateMultiloginAccountDto extends createZodDto(UpdateMultiloginAccountDtoSchema) {}

export const ListMultiloginAccountsDtoSchema = z.object({
  ...PaginationDtoSchema.shape,
  email: z.string().optional(),
  minMaxProfiles: z.coerce.number().int().min(1).optional(),
  maxMaxProfiles: z.coerce.number().int().min(1).optional(),
  hasAvailableSlots: z.coerce.boolean().optional(),
})

export class ListMultiloginAccountsDto extends createZodDto(ListMultiloginAccountsDtoSchema) {}

export const IdDtoSchema = z.object({
  id: z.string().min(1),
})

export class IdDto extends createZodDto(IdDtoSchema) {}
