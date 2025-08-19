import { baseConfig, createZodDto, selectConfig } from '@aitoearn/common'
import { mongodbConfigSchema } from '@aitoearn/mongodb'
import { ucloudConfigSchema } from '@aitoearn/ucloud'
import z from 'zod'

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  mongodb: mongodbConfigSchema,
  ucloud: ucloudConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) {}

export const config = selectConfig(AppConfig)
