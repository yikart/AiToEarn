import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export enum ConfigFileFormat {
  Json = 'json',
  Yaml = 'yaml',
}

export const ConfigEditorConfigVoSchema = z.object({
  config: z.record(z.string(), z.unknown()).describe('配置对象'),
  format: z.enum(ConfigFileFormat).describe('配置文件格式'),
})

export class ConfigEditorConfigVo extends createZodDto(ConfigEditorConfigVoSchema, 'ConfigEditorConfigVo') {}
