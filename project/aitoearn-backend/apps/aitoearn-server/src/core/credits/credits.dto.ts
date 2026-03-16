import { createZodDto, CreditsType, PaginationDtoSchema } from '@yikart/common'
import { z } from 'zod'

// 查询Credits记录列表的 DTO
export const creditsRecordsSchema = PaginationDtoSchema.extend({
  type: z.enum(CreditsType).optional().describe('Credits类型'),
})

export class CreditsRecordsDto extends createZodDto(creditsRecordsSchema, 'CreditsRecordsDto') {}
