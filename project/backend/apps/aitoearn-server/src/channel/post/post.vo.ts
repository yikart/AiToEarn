import { createZodDto } from '@yikart/common'
import { z } from 'zod'

export const PostSchema = z.object({
  postId: z.string().describe('帖子ID'),
  platform: z.string().describe('平台'),
  title: z.string().nullable().describe('标题'),
  content: z.string().nullable().describe('内容'),
  thumbnail: z.string().nullable().describe('封面/缩略图链接'),
  mediaType: z.enum(['video', 'image', 'article']).describe('媒体类型 video | image | article'),
  permaLink: z.string().nullable().describe('作品外部链接'),
  publishTime: z.number().describe('发布时间，时间戳'),
  viewCount: z.number().describe('浏览数'),
  commentCount: z.number().describe('评论数'),
  likeCount: z.number().describe('点赞数'),
  shareCount: z.number().describe('分享数'),
  clickCount: z.number().describe('点击数'),
  impressionCount: z.number().describe('曝光数'),
  favoriteCount: z.number().describe('收藏数'),
  updatedAt: z.date().describe('更新时间'),
}).describe('帖子数据')

export const FetchPostsResponseSchema = z.object({
  total: z.number().describe('总数'),
  posts: z.array(PostSchema).describe('帖子列表'),
  hasMore: z.boolean().describe('是否有更多数据, 当值为true时再请求下一页'),
})

export class PostVo extends createZodDto(PostSchema) { }
export class FetchPostsResponseVo extends createZodDto(FetchPostsResponseSchema) { }
