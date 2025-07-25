import { z } from 'zod'
import { MetaMediaStatus } from '@/libs/database/schema/metaContainer.schema'

export const MetaContainer = z.object({
  publishId: z.string({ required_error: '发布任务ID不能为空' }),
  userId: z.string({ required_error: '用户ID不能为空' }),
  platform: z.string({ required_error: '平台不能为空' }),
  taskId: z.string({ required_error: '任务ID不能为空' }),
  status: z.nativeEnum(MetaMediaStatus, {
    required_error: '任务状态不能为空',
  }).default(MetaMediaStatus.CREATED),
  accountId: z.string({ required_error: '账户ID不能为空' }),
  option: z.any().optional(),
})

export class CreateMetaContainerDto {
  constructor(data: z.infer<typeof MetaContainer>) {
    Object.assign(this, data);
  }
}
