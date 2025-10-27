import { createZodDto, natsConfig } from '@yikart/common'
import z from 'zod'

// 客户端配置
export const aitoearnAiConfigSchema = z.object({
  ...natsConfig.shape,
})

export class AitoearnAiClientConfig extends createZodDto(aitoearnAiConfigSchema) {}
