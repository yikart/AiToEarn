import { z } from 'zod'

export enum YoutubeOAuthGrantType {
  RefreshToken = 'refresh_token',
}

export enum YoutubePrivacyStatus {
  Public = 'public',
  Unlisted = 'unlisted',
  Private = 'private',
}

export enum YoutubeLicense {
  CreativeCommon = 'creativeCommon',
  Youtube = 'youtube',
}

export enum YoutubeSearchOrder {
  Date = 'date',
  Rating = 'rating',
  Relevance = 'relevance',
  Title = 'title',
  VideoCount = 'videoCount',
  ViewCount = 'viewCount',
}

export enum YoutubeSearchType {
  Channel = 'channel',
  Playlist = 'playlist',
  Video = 'video',
}

export const YoutubeOptionSchema = z.object({
  privacyStatus: z.enum(YoutubePrivacyStatus).optional().default(YoutubePrivacyStatus.Public).describe('隐私状态'),
  categoryId: z.string().optional().describe('分类 ID'),
  publishAt: z.string().datetime().optional().describe('定时发布时间，必须配合 private 隐私状态'),
  license: z.enum(YoutubeLicense).optional().describe('许可证'),
  embeddable: z.boolean().optional().default(true).describe('是否可嵌入'),
  notifySubscribers: z.boolean().optional().default(false).describe('是否通知订阅者'),
  selfDeclaredMadeForKids: z.boolean().optional().default(false).describe('是否自认为适合儿童'),
  madeForKids: z.boolean().optional().describe('YouTube 审核后的儿童内容标记'),
  containsSyntheticMedia: z.boolean().optional().describe('是否包含合成媒体内容'),
})

export type YoutubeOption = z.infer<typeof YoutubeOptionSchema>
