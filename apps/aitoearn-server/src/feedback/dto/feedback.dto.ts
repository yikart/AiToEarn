import { createZodDto } from '@yikart/common'
import { FeedbackType } from '@yikart/mongodb'
/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: 反馈
 */

import { z } from 'zod'

export const CreateFeedBackSchema = z.object({
  content: z.string().describe('内容'),
  type: z.enum(FeedbackType).optional().describe('类型'),
  tagList: z.array(z.string()).optional().describe('标识数组'),
  fileUrlList: z.array(z.string()).optional().describe('文件链接数组'),
})
export class CreateFeedBackDto extends createZodDto(CreateFeedBackSchema) {}

export const GetFeedbackListSchema = z.object({
  time: z
    .array(z.string())
    .optional()
    .describe('时间范围数组，格式为[startDate, endDate]，格式YYYY-MM-DD'),
  userId: z.string().optional().describe('用户ID'),
  type: z.enum(FeedbackType).optional().describe('反馈类型'),
})
export class GetFeedbackListDto extends createZodDto(GetFeedbackListSchema) {}
