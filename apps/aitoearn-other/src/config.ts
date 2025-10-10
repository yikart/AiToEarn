import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import { oneSignalConfigSchema } from '@yikart/one-signal'
import z from 'zod'

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  mongodb: mongodbConfigSchema,
  oneSignal: oneSignalConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) {}

export const config = selectConfig(AppConfig)
