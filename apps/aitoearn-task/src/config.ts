import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import z from 'zod'

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  redis: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    keepAlive: z.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    db: z.number().optional(),
    connectTimeout: z.number().optional().default(10000),
  }),
  taskDb: mongodbConfigSchema,
  environment: z.string().default('development'),
})

export class AppConfig extends createZodDto(appConfigSchema) { }

export const config = selectConfig(AppConfig)
