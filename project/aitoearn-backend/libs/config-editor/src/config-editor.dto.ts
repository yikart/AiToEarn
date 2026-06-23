import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const ConfigEditorConfigDtoSchema = z.object({
  config: z.record(z.string(), z.unknown()).describe('配置对象'),
})

export class ConfigEditorConfigDto extends createZodDto(ConfigEditorConfigDtoSchema, 'ConfigEditorConfigDto') {}
