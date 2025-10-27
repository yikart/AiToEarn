export interface PostData {
  id: string // '记录ID',
  postId: string // '帖子ID',
  platform: string // describe('平台'),
  title?: string // nullable;.describe('标题'),
  content?: string // .nullable;.describe('内容'),
  thumbnail?: string // .nullable;.describe('封面/缩略图链接'),
  mediaType: 'video' | 'image' | 'article'
  permaLink?: string // .nullable;.describe('作品外部链接'),
  publishTime: number // .describe('发布时间，时间戳'),
  viewCount: number// .describe('浏览数'),
  commentCount: number // .describe('评论数'),
  likeCount: number // .describe('点赞数'),
  shareCount: number // .describe('分享数'),
  clickCount: number // .describe('点击数'),
  impressionCount: number // .describe('曝光数'),
  favoriteCount: number // .describe('收藏数'),
  updatedAt: Date// .describe('更新时间'),
}
