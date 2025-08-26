import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

export const getMaterialSchema = z.object({
  id: z.string().min(1),
})

export class GetMaterialDto extends createZodDto(getMaterialSchema) {}

export const getMaterialsByTaskIdSchema = z.object({
  taskId: z.string().min(1),
})

export class GetMaterialsByTaskIdDto extends createZodDto(
  getMaterialsByTaskIdSchema,
) {}
