import { AccountType } from '@yikart/aitoearn-server-client'
import { z } from 'zod/v3'
import { PublishType } from '../../../libs/database/schema/publishTask.schema'

export const GetAuthPageSchema = z.object({
  accountType: z.nativeEnum(AccountType).describe('平台类型'),
})

export const McpPublishSchema = z.object({
  skKey: z.string().describe('skKey'),
  type: z.nativeEnum(PublishType).describe('类型'),
  title: z.string().nullable().optional().transform(val => !val ? undefined : val),
  desc: z.string().nullable().optional().transform(val => !val ? undefined : val),
  videoUrl: z.string().nullable().optional().transform(val => !val ? undefined : val),
  coverUrl: z.string().nullable().optional().transform(val => !val ? undefined : val),
  imgUrlList: z.string().nullable().optional().transform(val => !val ? undefined : val),
  publishTime: z.string().nullable().optional().transform(val => !val ? undefined : val),
  topics: z.string(),
})

export const McpPromptPublishSchema = z.object({
  id: z.string(),
  userId: z.string(),
})

export const UpdatePublishTaskTimeSchema = z.object({
  id: z.string().describe('publishing task ID'),
  publishingTime: z.date().default(() => new Date()),
  userId: z.string(),
})

export const McpAuthedAccountSchema = z.object({
  accountId: z.string().describe('accountId'),
  userId: z.string().describe('userId'),
  platform: z.nativeEnum(AccountType).describe('平台类型'),
  nickname: z.string().nullable().optional().describe('昵称'),
})

export const McpAuthedAccountsResponseSchema = z.object({
  accounts: z.array(McpAuthedAccountSchema).describe('已授权账号列表'),
})

export const CreatePublishingTaskRespItemSchema = z.object({
  id: z.string().describe('任务ID'),
}).describe('创建的发布任务信息')

export const CreatePublishingTaskRespSchema = z.object({
  tasks: z.array(CreatePublishingTaskRespItemSchema).describe('创建的发布任务列表'),
})

export const UpdatePublishingTimeRespSchema = z.object({
  id: z.string().describe('任务ID'),
  publishTime: z.string().describe('新的发布时间'),
}).describe('更新发布任务时间响应')

export type McpPublishDto = z.infer<typeof McpPublishSchema>
export type UpdatePublishTaskTimeDto = z.infer<typeof UpdatePublishTaskTimeSchema>
export type McpAuthedAccountVo = z.infer<typeof McpAuthedAccountSchema>
export type McpAuthedAccountsRespVo = z.infer<typeof McpAuthedAccountsResponseSchema>
export type CreatePublishingTaskResp = z.infer<typeof CreatePublishingTaskRespSchema>
export type UpdatePublishingTimeResp = z.infer<typeof UpdatePublishingTimeRespSchema>
