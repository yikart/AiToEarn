import { createZodDto, natsConfig } from '@yikart/common'
import z from 'zod'

// 客户端配置
export const aitoearnUserConfigSchema = z.object({
  ...natsConfig.shape,
})

export class AitoearnUserClientConfig extends createZodDto(aitoearnUserConfigSchema) {}
