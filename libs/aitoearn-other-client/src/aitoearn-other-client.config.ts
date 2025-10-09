import { createZodDto, natsConfig } from '@yikart/common'
import z from 'zod'

// 客户端配置
export const aitoearnOtherConfigSchema = z.object({
  ...natsConfig.shape,
})

export class AitoearnOtherClientConfig extends createZodDto(aitoearnOtherConfigSchema) {}
