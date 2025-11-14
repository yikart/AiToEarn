import { AccountType, createZodDto } from '@yikart/common'
import { PublishStatus } from '@yikart/mongodb'
import { z } from 'zod'
import { PublishingChannel } from '../../transports/channel/common'

export const PublishRecordItemVoSchema = z.object({
  dataId: z.string().optional().describe('数据ID'),
  id: z.string().describe('记录ID'),
  flowId: z.string().optional().describe('流程ID'),
  type: z.string().describe('发布类型'),
  title: z.string().optional().describe('发布标题'),
  desc: z.string().optional().describe('发布描述'),
  accountId: z.string().describe('账号ID'),
  accountType: z.enum(AccountType).describe('账号类型'),
  uid: z.string().optional().describe('用户UID'),
  videoUrl: z.string().optional().describe('视频地址'),
  coverUrl: z.string().optional().describe('封面图地址'),
  imgUrlList: z.array(z.string()).default([]).describe('图片列表'),
  publishTime: z.date().describe('发布时间'),
  status: z.enum(PublishStatus).describe('发布状态'),
  errorMsg: z.string().optional().describe('错误信息'),
  publishingChannel: z.nativeEnum(PublishingChannel).optional().describe('发布渠道'),
  workLink: z.string().optional().describe('作品链接'),
})
export class PublishRecordItemVo extends createZodDto(PublishRecordItemVoSchema) {}

export const PostEngagementVoSchema = z.object({
  viewCount: z.number().describe('浏览量'),
  commentCount: z.number().describe('评论数'),
  likeCount: z.number().describe('点赞数'),
  shareCount: z.number().describe('分享数'),
  clickCount: z.number().describe('点击数'),
  impressionCount: z.number().describe('曝光数'),
  favoriteCount: z.number().describe('收藏数'),
})
export class PostEngagementVo extends createZodDto(PostEngagementVoSchema) {}

export const PostHistoryItemVoSchema = PublishRecordItemVoSchema.extend({
  engagement: PostEngagementVoSchema.describe('作品互动统计数据'),
})
export class PostHistoryItemVo extends createZodDto(PostHistoryItemVoSchema) {}
