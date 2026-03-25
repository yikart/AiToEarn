import { AccountType, createZodDto } from '@yikart/common'
import { z } from 'zod'

const RelayCallbackDtoSchema = z.object({
  relayAccountRef: z.string().min(1).describe('官方服务器上的账号 ID'),
  nickname: z.string().describe('账号昵称'),
  avatar: z.string().optional().describe('账号头像'),
  platformUid: z.string().min(1).describe('平台用户 ID'),
  accountType: z.enum(AccountType).describe('平台类型'),
  taskId: z.string().optional().describe('授权任务 ID'),
})
export class RelayCallbackDto extends createZodDto(RelayCallbackDtoSchema, 'RelayCallbackDto') {}
