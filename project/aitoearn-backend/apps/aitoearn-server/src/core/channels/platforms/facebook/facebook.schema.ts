import { z } from 'zod'
import { FacebookContentCategory, FacebookVideoState } from './facebook.enum'

export { FacebookContentCategory, FacebookVideoState }

export const FacebookOptionSchema = z.object({
  content_category: z.enum(FacebookContentCategory).optional().describe('内容分类'),
  link: z.httpUrl().optional().describe('Feed 链接'),
  content_tags: z.array(z.string()).optional().describe('内容标签'),
  custom_labels: z.array(z.string()).optional().describe('自定义标签'),
  direct_share_status: z.number().optional().describe('直接分享状态'),
  embeddable: z.boolean().optional().describe('是否可嵌入'),
  feed_targeting: z.record(z.string(), z.unknown()).optional().describe('Feed 定向'),
  video_state: z.enum(FacebookVideoState).optional().describe('Reels/视频发布状态'),
})

export type FacebookOption = z.infer<typeof FacebookOptionSchema>
