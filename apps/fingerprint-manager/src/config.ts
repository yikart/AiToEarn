import { baseConfig, createZodDto, selectConfig } from '@aitoearn/common'
import { mongodbConfigSchema } from '@aitoearn/mongodb'
import { RedlockConfigSchema } from '@aitoearn/redlock'
import { ucloudConfigSchema } from '@aitoearn/ucloud'
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
  ansible: z.object({
    inventoryPath: z.string(),
    playbookPath: z.string(),
    verbosity: z.number().default(1),
    timeout: z.number().default(300),
    forks: z.number().default(5),
  }),
  redlock: RedlockConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) {}

export const config = selectConfig(AppConfig)
