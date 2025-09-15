import { ansibleConfigSchema } from '@yikart/ansible'
import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import { redlockConfigSchema } from '@yikart/redlock'
import { ucloudConfigSchema } from '@yikart/ucloud'
import z from 'zod'

const jwtConfigSchema = z.object({
  secret: z.string().default(''),
  expiresIn: z.number().default(7 * 24 * 60 * 60),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  mongodb: mongodbConfigSchema,
  ucloud: z.object({
    ...ucloudConfigSchema.shape,
    imageId: z.string(),
    bundleId: z.string(),
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
  redis: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    keepAlive: z.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    db: z.number().optional(),
  }),
  ansible: ansibleConfigSchema,
  redlock: redlockConfigSchema,
  jwt: jwtConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) {}

export const config = selectConfig(AppConfig)
