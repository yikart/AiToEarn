import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const CreateApiKeyDtoSchema = z.object({
  name: z.string().min(1).max(100).describe('API Key 名称'),
})
export class CreateApiKeyDto extends createZodDto(CreateApiKeyDtoSchema, 'CreateApiKeyDto') {}
