import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { EngagementTargetScope, EngagementTaskStatus, EngagementTaskType } from '../../../libs/database/schema/engagement.task.schema'

export const EngagementTask = z.object({
  accountId: z.string({ message: 'accountId is required' }).describe('账号ID'),
  userId: z.string(),
  postId: z.string(),
  platform: z.enum(['facebook', 'instagram', 'threads', 'twitter', 'youtube', 'tiktok', 'bilibili', 'douyin', 'KWAI', 'xhs', 'linkedin', 'wxGzh', 'pinterest']).describe('平台'),
  status: z.enum(EngagementTaskStatus).default(EngagementTaskStatus.CREATED),
  taskType: z.enum(EngagementTaskType).default(EngagementTaskType.REPLY),
  targetScope: z.enum(EngagementTargetScope).default(EngagementTargetScope.ALL),
  prompt: z.string().min(1).max(500).optional(),
  model: z.string(),
  targetIds: z.array(z.string()).nullable().default([]),
  subTaskCount: z.number().default(0),
  completedSubTaskCount: z.number().default(0),
  failedSubTaskCount: z.number().default(0),
})

export const EngagementSubTask = z.object({
  accountId: z.string({ message: 'accountId is required' }).describe('账号ID'),
  postId: z.string(),
  userId: z.string(),
  platform: z.string(),
  status: z.enum(EngagementTaskStatus).default(EngagementTaskStatus.CREATED),
  taskType: z.enum(EngagementTaskType).default(EngagementTaskType.REPLY),
  taskId: z.string(),
  commentId: z.string(),
  commentContent: z.string(),
  replyContent: z.string().optional(),
})

export class CreateEngagementTaskDto extends createZodDto(EngagementTask) {}
export class CreateEngagementSubTaskDto extends createZodDto(EngagementSubTask) {}
