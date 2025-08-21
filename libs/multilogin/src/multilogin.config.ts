import { createZodDto } from '@aitoearn/common'
import { z } from 'zod'

export const multiloginConfigSchema = z.object({
  launcherBaseUrl: z.string().default('https://launcher.mlx.yt:45001'),
  profileBaseUrl: z.string().default('https://api.multilogin.com'),
  timeout: z.number().default(30000),
})

export class MultiloginConfig extends createZodDto(multiloginConfigSchema) {}
