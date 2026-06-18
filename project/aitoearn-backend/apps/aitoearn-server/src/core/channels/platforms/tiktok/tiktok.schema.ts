import { z } from 'zod'
import { TikTokContentPostingEvent, TikTokPublishStatus } from './tiktok.interface'

export enum TikTokPrivacyLevel {
  Public = 'PUBLIC_TO_EVERYONE',
  MutualFollowFriends = 'MUTUAL_FOLLOW_FRIENDS',
  SelfOnly = 'SELF_ONLY',
  FollowerOfCreator = 'FOLLOWER_OF_CREATOR',
}

export enum TikTokPostSource {
  FileUpload = 'FILE_UPLOAD',
  PullFromUrl = 'PULL_FROM_URL',
}

export enum TikTokContentPath {
  Video = 'video',
  Photo = 'photo',
}

export const TiktokOptionSchema = z.object({
  privacy_level: z.enum(TikTokPrivacyLevel).optional().describe('隐私级别，必须在 creator_info 返回的可选值内'),
  disable_duet: z.boolean().optional().describe('是否禁用合拍'),
  disable_stitch: z.boolean().optional().describe('是否禁用拼接'),
  disable_comment: z.boolean().optional().describe('是否禁用评论'),
  brand_organic_toggle: z.boolean().optional().describe('品牌有机内容'),
  brand_content_toggle: z.boolean().optional().describe('品牌内容'),
  auto_add_music: z.boolean().optional().describe('图文发布自动配乐'),
  photo_cover_index: z.number().int().min(0).optional().describe('图文封面图片下标'),
  source: z.enum(TikTokPostSource).optional().describe('视频上传来源'),
  is_aigc: z.boolean().optional().describe('视频发布是否声明为 AI 生成内容'),
})

export type TiktokOption = z.infer<typeof TiktokOptionSchema>

export const TikTokPublishDataOptionSchema = z.object({
  publishId: z.string().min(1).describe('TikTok Content Posting API publish_id，仅用于发布状态关联'),
  source: z.enum(TikTokPostSource).optional().describe('发布媒体来源'),
  contentPath: z.enum(TikTokContentPath).describe('公开作品链接路径类型'),
  username: z.string().min(1).optional().describe('TikTok username，用于构造 canonical 作品链接'),
  publishStatus: z.enum(TikTokPublishStatus).optional().describe('TikTok Content Posting API 官方发布状态'),
  finalPostId: z.string().min(1).optional().describe('TikTok 最终公开作品 post_id'),
  error: z.string().optional().describe('TikTok 发布失败原因'),
  webhookEvent: z.enum(TikTokContentPostingEvent).optional().describe('TikTok Content Posting webhook 事件'),
  webhookCreateTime: z.number().int().optional().describe('TikTok Content Posting webhook create_time'),
  webhookUserOpenId: z.string().optional().describe('TikTok Content Posting webhook user_openid'),
})

export type TikTokPublishDataOption = z.infer<typeof TikTokPublishDataOptionSchema>
