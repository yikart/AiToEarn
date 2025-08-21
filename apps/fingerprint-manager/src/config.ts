import { baseConfig, createZodDto, selectConfig } from '@aitoearn/common'
import { mongodbConfigSchema } from '@aitoearn/mongodb'
import { multiloginConfigSchema } from '@aitoearn/multilogin'
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
  multilogin: z.object(({
    ...multiloginConfigSchema.shape,
    folderId: z.string(),
  })),
  redlock: RedlockConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) {}

export const config = selectConfig(AppConfig)
