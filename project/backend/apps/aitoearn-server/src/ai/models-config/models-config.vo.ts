import { createZodDto } from '@yikart/common'
import { aiModelsConfigSchema } from '../../config'

export class ModelsConfigVo extends createZodDto(aiModelsConfigSchema) {}
