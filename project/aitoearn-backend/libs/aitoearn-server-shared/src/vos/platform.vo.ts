import { WorkStatus } from '@yikart/common'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// WorkLinkInfo
// ---------------------------------------------------------------------------

export const WorkLinkInfoSchema = z.object({
  dataId: z.string().describe('数据 ID'),
  uniqueId: z.string().describe('唯一标识'),
  type: z.string().describe('类型'),
  videoType: z.enum(['short', 'long']).optional().describe('视频类型'),
  resolvedUrl: z.string().optional().describe('解析后的 URL'),
  originalWorkLink: z.string().optional().describe('原始作品链接'),
  workStatus: z.literal(WorkStatus.LINK_ERROR).optional().describe('作品状态'),
})
export interface WorkLinkInfo extends z.infer<typeof WorkLinkInfoSchema> {}

// ---------------------------------------------------------------------------
// WorkDetailInfo
// ---------------------------------------------------------------------------

export const WorkDetailInfoSchema = z.object({
  dataId: z.string().describe('数据 ID'),
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('描述'),
  topics: z.array(z.string()).optional().describe('话题列表'),
  coverUrl: z.string().optional().describe('封面 URL'),
  videoUrl: z.string().optional().describe('视频 URL'),
  imgUrlList: z.array(z.string()).optional().describe('图片 URL 列表'),
  publishTime: z.coerce.date().optional().describe('发布时间'),
  type: z.string().describe('类型'),
  videoType: z.enum(['short', 'long']).optional().describe('视频类型'),
  duration: z.number().optional().describe('时长（秒）'),
  rawData: z.record(z.string(), z.unknown()).optional().describe('原始数据'),
})
export interface WorkDetailInfo extends z.infer<typeof WorkDetailInfoSchema> {}
