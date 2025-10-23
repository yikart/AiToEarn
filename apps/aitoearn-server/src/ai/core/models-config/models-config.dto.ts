import { createZodDto } from '@yikart/common'
import { aiModelsConfigSchema } from '../../../config'

export class ModelsConfigDto extends createZodDto(aiModelsConfigSchema) {}
