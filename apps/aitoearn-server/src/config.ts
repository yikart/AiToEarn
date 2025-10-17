import { ansibleConfigSchema } from '@yikart/ansible'
import { s3ConfigSchema } from '@yikart/aws-s3'
import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import { oneSignalConfigSchema } from '@yikart/one-signal'
import { redlockConfigSchema } from '@yikart/redlock'
import { ucloudConfigSchema } from '@yikart/ucloud'
import z from 'zod'

// JWT配置
const jwtConfigSchema = z.object({
  secret: z.string().default(''),
  expiresIn: z.number().default(7 * 24 * 60 * 60),
})

const mailConfigSchema = z.object({
  transport: z.object({
    host: z.string().default(''),
    port: z.number().default(587),
    secure: z.boolean().default(false),
    auth: z.object({
      user: z.string().default(''),
      pass: z.string().default(''),
    }),
  }),
  defaults: z.object({
    from: z.string().default(''),
  }),
  template: z.any().optional(),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  ucloud: z.object({
    ...ucloudConfigSchema.shape,
    imageId: z.string(),
    bundleId: z.string(),
  }),
  redis: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    keepAlive: z.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    db: z.number().optional(),
    connectTimeout: z.number().optional().default(10000),
  }),
  multilogin: z.object({
    launcherBaseUrl: z.string().default('https://launcher.mlx.yt:45001'),
    profileBaseUrl: z.string().default('https://api.multilogin.com'),
    timeout: z.number().default(30000),
    folderId: z.string(),
    defaultUrl: z.string().default('https://example.com'),
    agent: z.object({
      url: z.string().default('https://example.com'),
      gitUrl: z.string(),
      gitBranch: z.string(),
    }),
  }),
  github: z.object({
    token: z.string(),
    repo: z.string(),
  }),
  ansible: ansibleConfigSchema,
  mongodb: mongodbConfigSchema,
  redlock: redlockConfigSchema,
  jwt: jwtConfigSchema,
  oneSignal: oneSignalConfigSchema,
  s3: s3ConfigSchema,
  mail: mailConfigSchema,
  environment: z.string().default('development'),
})

export class AppConfig extends createZodDto(appConfigSchema) { }

export const config = selectConfig(AppConfig)
