import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { redisConfigSchema } from '@yikart/redis'
import { z } from 'zod'
import { s3ConfigSchema } from './libs/aws-s3/s3.config'

const userServerConfigSchema = z.object({
  host: z.string().default('http://127.0.0.1'),
})

const jwtConfigSchema = z.object({
  secret: z.string().default(''),
  expiresIn: z.number().default(7 * 24 * 60 * 60),
})

export const mongodbConfigSchema = z.object({
  uri: z.string(),
  dbName: z.string().optional(),
  autoIndex: z.boolean().optional(),
  autoCreate: z.boolean().optional(),
})

export const configSchema = z.object({
  ...baseConfig.shape,
  environment: z.string().default('development'),
  redis: redisConfigSchema,
  mongodb: mongodbConfigSchema,
  statisticsDb: mongodbConfigSchema,
  awsS3: s3ConfigSchema,
  userServer: userServerConfigSchema,
  jwt: jwtConfigSchema,
  serverApi: z.object({
    baseUrl: z.string().default('http://localhost:3000/api'),
    internalToken: z.string(),
  }),
  channelApi: z.object({
    baseUrl: z.string().default('http://localhost:3000/api'),
  }),
  paymentApi: z.object({
    baseUrl: z.string().default('http://localhost:3000/api'),
  }),
  taskApi: z.object({
    baseUrl: z.string().default('http://localhost:3000/api'),
  }),
})

export class AppConfig extends createZodDto(configSchema) { }

export const config = selectConfig(AppConfig)
