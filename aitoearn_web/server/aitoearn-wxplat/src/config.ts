import { createZodDto, selectConfig } from '@common/utils'
import { z } from 'zod/v4'

// 服务器配置
const serverConfigSchema = z.object({
  port: z.number().default(7001),
  env: z.string().default('development'),
  docs: z
    .object({
      enabled: z.boolean().default(true),
      path: z.string().default('/doc'),
    })
    .optional(),
  enableBadRequestDetails: z.boolean().default(false),
})

// Redis配置
const redisConfigSchema = z.object({
  name: z.string().default('default'),
  host: z.string().default('127.0.0.1'),
  port: z.number().default(6379),
  password: z.string().default(''),
  db: z.number().default(0),
  connectTimeout: z.number().default(10000),
})

// wxPlat配置
const WxPlatSchema = z.object({
  id: z.string().default(''),
  secret: z.string().default(''),
  token: z.string().default(''),
  encodingAESKey: z.string().default(''),
  authBackHost: z.string().default(''),
})

export const configSchema = z.object({
  ...serverConfigSchema.shape,
  redis: redisConfigSchema,
  wxPlat: WxPlatSchema,
  msgUrlList: z.array(z.string()).default([]),
  authUrlMap: z.any().default({}),
})

export class AppConfig extends createZodDto(configSchema) {}

export const config = selectConfig(AppConfig)
