import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import { redisConfigSchema } from '@yikart/redis'
import z from 'zod'

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  redis: redisConfigSchema,
  taskDb: mongodbConfigSchema,
  environment: z.string().default('development'),
})

export class AppConfig extends createZodDto(appConfigSchema) { }

export const config = selectConfig(AppConfig)
