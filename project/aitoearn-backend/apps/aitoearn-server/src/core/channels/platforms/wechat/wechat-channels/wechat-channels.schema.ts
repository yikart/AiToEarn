import { z } from 'zod'

export const WeChatChannelsLinkMetaSchema = z.object({
  mediaMd5sum: z.string().optional().describe('视频号媒体 MD5'),
  videoClipTaskId: z.string().optional().describe('视频号剪辑任务 ID'),
  scheduledTime: z.number().optional().describe('视频号定时发布时间戳'),
})

export const WeChatChannelsOptionSchema = z.object({
  workId: z.string().optional().describe('插件返回的作品锚点 ID'),
  workLink: z.string().optional().describe('插件返回的作品链接'),
  linkStatus: z.enum(['pending', 'ready', 'failed']).optional().describe('作品链接状态'),
  linkMeta: WeChatChannelsLinkMetaSchema.optional().describe('作品链接扩展信息'),
})

export type WeChatChannelsOption = z.infer<typeof WeChatChannelsOptionSchema>
