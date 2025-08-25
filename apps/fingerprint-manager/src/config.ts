import { ansibleConfigSchema } from '@yikart/ansible'
import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import { RedlockConfigSchema } from '@yikart/redlock'
import { ucloudConfigSchema } from '@yikart/ucloud'
import z from 'zod'

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
  ansible: ansibleConfigSchema,
  redlock: RedlockConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) {}

export const config = selectConfig(AppConfig)
