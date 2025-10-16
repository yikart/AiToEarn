import { s3ConfigSchema } from '@yikart/aws-s3'
import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import { oneSignalConfigSchema } from '@yikart/one-signal'
import z from 'zod'

// JWT配置
const jwtConfigSchema = z.object({
  secret: z.string().default(''),
  expiresIn: z.string().default('7d'),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  mongodb: mongodbConfigSchema,
  jwt: jwtConfigSchema,
  oneSignal: oneSignalConfigSchema,
  s3: s3ConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) {}

export const config = selectConfig(AppConfig)
