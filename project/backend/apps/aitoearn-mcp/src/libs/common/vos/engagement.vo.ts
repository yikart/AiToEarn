import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const KeysetPaginationSchema = z.object({
  before: z.string().nullish().describe('前一页游标'),
  after: z.string().nullish().describe('后一页游标'),
  limit: z.number().min(1).max(100).nullish().describe('每页数量,默认20'),
})

export const OffsetPaginationSchema = z.object({
  pageNo: z.number({ message: '页码' }).min(1).nullish().default(1).describe('页码,默认1'),
  pageSize: z.number({ message: '每页数量' }).min(1).max(100).nullish().default(20).describe('每页数量,默认20'),
})

export const mediaSchema = z.object({
  url: z.string().describe('Media URL'),
  type: z.enum(['image', 'video']).describe('Type of media'),
  thumbnail: z.string().nullish().describe('Thumbnail URL for video media'),
})

export const postSchema = z.object({
  id: z.string().describe('Post ID'),
  platform: z.string().describe('Platform of the post'),
  title: z.string().nullish().describe('Title of the post'),
  content: z.string().describe('Content of the post'),
  medias: z.array(mediaSchema).describe('List of media associated with the post'),
  permalink: z.string().describe('Permanent link to the post'),
  publishTime: z.number().describe('Publish time in milliseconds since epoch'),
  viewCount: z.number().describe('Number of views').default(0),
  commentCount: z.number().describe('Number of comments').default(0),
  likeCount: z.number().describe('Number of likes').default(0),
  shareCount: z.number().describe('Number of shares').default(0),
  clickCount: z.number().describe('Number of clicks').default(0),
  impressionCount: z.number().describe('Number of impressions').default(0),
  favoriteCount: z.number().describe('Number of favorites').default(0),
})

export const PostsResponseSchema = z.object({
  posts: z.array(postSchema).describe('List of posts'),
  cursor: KeysetPaginationSchema.describe('Pagination cursor information'),
})

export class PostVo extends createZodDto(postSchema) {}
export class PostsResponseVo extends createZodDto(PostsResponseSchema) {}
