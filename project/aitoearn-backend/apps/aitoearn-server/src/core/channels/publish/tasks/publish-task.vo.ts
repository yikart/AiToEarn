import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const ChannelPublishTaskOperationVoSchema = z.object({
  taskId: z.string().describe('发布任务 ID'),
})

export class ChannelPublishTaskOperationVo extends createZodDto(
  ChannelPublishTaskOperationVoSchema,
  'ChannelPublishTaskOperationVo',
) {}
