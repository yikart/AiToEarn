import { createZodDto } from '@yikart/common'
import { z } from 'zod'

/**
 * 账号ID DTO
 */
const AccountIdSchema = z.object({
  accountId: z.string({ message: '账号ID必须是字符串' }),
})

export class AccountIdDto extends createZodDto(AccountIdSchema) {}

/**
 * 获取视频类别列表 DTO
 * 注意：id和regionCode只能选择一个
 */
const GetVideoCategoriesSchema = AccountIdSchema.extend({
  id: z.string({
    message: '视频类别ID必须是字符串, 注意：id和regionCode必须有且只能选择一个',
  }).optional(),
  regionCode: z.string({
    message: '区域代码必须是字符串, 注意：id和regionCode只能选择一个',
  }).optional(),
})

export class GetVideoCategoriesDto extends createZodDto(GetVideoCategoriesSchema) {}

/**
 * 获取视频列表 DTO
 */
const GetVideosListSchema = AccountIdSchema.extend({
  chart: z.string().optional(),
  id: z.string().optional(),
  myRating: z.boolean().optional(),
  maxResults: z.number().optional(),
  pageToken: z.string().optional(),
})
export class GetVideosListDto extends createZodDto(GetVideosListSchema) {}

/**
 * 上传小视频(小于20MB) DTO
 */
const UploadSmallVideoSchema = AccountIdSchema.extend({
  title: z.string({ message: '标题必须是字符串' }),
  description: z.string({ message: '描述必须是字符串' }),
  privacyStatus: z.string({ message: '隐私状态必须是字符串' }),
  keywords: z.string().optional(),
  categoryId: z.string().optional(),
  publishAt: z.string().optional(),
})
export class UploadSmallVideoDto extends createZodDto(UploadSmallVideoSchema) {}

/**
 * 初始化视频上传 DTO
 */
const InitVideoUploadSchema = AccountIdSchema.extend({
  title: z.string({ message: '标题必须是字符串' }),
  description: z.string({ message: '描述必须是字符串' }),
  keywords: z.string().optional(),
  categoryId: z.string().optional(),
  privacyStatus: z.string({ message: '隐私状态必须是字符串' }),
  publishAt: z.string().optional(),
  contentLength: z.number({ message: '视频文件总大小，字节数' }),
})
export class InitVideoUploadDto extends createZodDto(InitVideoUploadSchema) {}

/**
 * 上传视频分片 DTO
 */
const UploadVideoPartSchema = AccountIdSchema.extend({
  uploadToken: z.string({ message: '上传token' }),
  partNumber: z.number({ message: '分片索引' }),
})
export class UploadVideoPartDto extends createZodDto(UploadVideoPartSchema) {}

/**
 * 完成视频上传 DTO
 */
const UploadVideoCompleteSchema = AccountIdSchema.extend({
  uploadToken: z.string({ message: '上传令牌必须是字符串' }),
  totalSize: z.number({ message: '视频文件总大小，字节数' }),
})
export class UploadVideoCompleteDto extends createZodDto(UploadVideoCompleteSchema) {}

/**
 * 获取子评论列表 DTO
 */
const GetCommentsListSchema = AccountIdSchema.extend({
  id: z.string().optional(),
  parentId: z.string().optional(),
  maxResults: z.number().optional(),
  pageToken: z.string().optional(),
})
export class GetCommentsListDto extends createZodDto(GetCommentsListSchema) {}

// 创建顶级评论
const InsertCommentThreadsSchema = AccountIdSchema.extend({
  channelId: z.string({ message: '频道ID必须是字符串' }),
  videoId: z.string({ message: '视频ID必须是字符串' }),
  textOriginal: z.string({ message: '评论内容必须是字符串' }),
})
export class InsertCommentThreadsDto extends createZodDto(InsertCommentThreadsSchema) {}

// 获取评论会话列表
const GetCommentThreadsListSchema = AccountIdSchema.extend({
  id: z.string().optional(),
  allThreadsRelatedToChannelId: z.string().optional(),
  videoId: z.string().optional(),
  maxResults: z.number().optional(),
  pageToken: z.string().optional(),
  order: z.enum(['time', 'relevance']).optional(),
  searchTerms: z.string().optional(),
})
export class GetCommentThreadsListDto extends createZodDto(GetCommentThreadsListSchema) {}

// 定义 topLevelComment.snippet 的子类
const SecondLevelCommentSnippetSchema = z.object({
  textOriginal: z.string().optional(),
  parentId: z.string().optional(),
})
export class SecondLevelCommentSnippetDto extends createZodDto(SecondLevelCommentSnippetSchema) {}

// 创建二级评论
const InsertCommentSchema = z.object({
  textOriginal: z.string().optional(),
  parentId: z.string().optional(),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class InsertCommentDto extends createZodDto(InsertCommentSchema) {}

// 更新评论
const UpdateCommentSchema = z.object({
  id: z.string({ message: '评论ID' }),
  accountId: z.string({ message: '账号ID必须是字符串' }),
  textOriginal: z.string({ message: '评论内容必须是字符串' }),
})
export class UpdateCommentDto extends createZodDto(UpdateCommentSchema) {}

// 设置评论审核状态
const SetCommentThreadsModerationStatusSchema = z.object({
  id: z.string({ message: '评论ID' }),
  moderationStatus: z.enum(['heldForReview', 'published', 'rejected']),
  banAuthor: z.boolean().optional(),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class SetCommentThreadsModerationStatusDto extends createZodDto(SetCommentThreadsModerationStatusSchema) {}

// 删除评论
const DeleteCommentSchema = z.object({
  id: z.string({ message: '评论ID' }),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class DeleteCommentDto extends createZodDto(DeleteCommentSchema) {}

// 对视频的点赞、踩
const VideoRateSchema = z.object({
  id: z.string({ message: '视频ID' }),
  rating: z.enum(['like', 'dislike', 'none']),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class VideoRateDto extends createZodDto(VideoRateSchema) {}

// 获取视频的点赞、踩
const GetVideoRateSchema = z.object({
  id: z.string({ message: '视频ID' }),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class GetVideoRateDto extends createZodDto(GetVideoRateSchema) {}

// 删除视频
const DeleteVideoSchema = z.object({
  id: z.string({ message: '视频ID' }),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class DeleteVideoDto extends createZodDto(DeleteVideoSchema) {}

// 更新视频
const UpdateVideoSchema = z.object({
  id: z.string({ message: '视频ID' }),
  title: z.string({ message: '标题' }),
  categoryId: z.string({ message: '类别ID' }),
  defaultLanguage: z.string().optional(),
  description: z.string().optional(),
  privacyStatus: z.string().optional(),
  tags: z.string().optional(),
  publishAt: z.string().optional(),
  recordingDate: z.string().optional(),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class UpdateVideoDto extends createZodDto(UpdateVideoSchema) {}

// 创建播放列表
const InsertPlayListSchema = z.object({
  title: z.string({ message: '标题' }),
  description: z.string().optional(),
  privacyStatus: z.string().optional(),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class InsertPlayListDto extends createZodDto(InsertPlayListSchema) {}

// 获取播放列表
const GetPlayListSchema = z.object({
  channelId: z.string().optional(),
  id: z.string().optional(),
  mine: z.boolean().optional(),
  maxResults: z.number().optional(),
  pageToken: z.string().optional(),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class GetPlayListDto extends createZodDto(GetPlayListSchema) {}

// 更新播放列表
const UpdatePlayListSchema = z.object({
  id: z.string({ message: '播放列表ID' }),
  title: z.string({ message: '标题' }),
  description: z.string().optional(),
  privacyStatus: z.string().optional(),
  podcastStatus: z.string().optional(),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class UpdatePlayListDto extends createZodDto(UpdatePlayListSchema) {}

// 删除播放列表
const DeletePlayListSchema = z.object({
  id: z.string({ message: '播放列表ID' }),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class DeletePlayListDto extends createZodDto(DeletePlayListSchema) {}

// 获取播放列表项
const GetPlayItemsSchema = z.object({
  id: z.string().optional(),
  playlistId: z.string().optional(),
  maxResults: z.number().optional(),
  pageToken: z.string().optional(),
  videoId: z.string().optional(),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class GetPlayItemsDto extends createZodDto(GetPlayItemsSchema) {}

// 插入播放列表项
const InsertPlayItemsSchema = z.object({
  playlistId: z.string({ message: '播放列表ID' }),
  resourceId: z.string({ message: '资源ID' }),
  position: z.number().optional(),
  note: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class InsertPlayItemsDto extends createZodDto(InsertPlayItemsSchema) {}

// 更新播放列表项
const UpdatePlayItemsSchema = z.object({
  id: z.string({ message: '播放列表项ID' }),
  playlistId: z.string({ message: '播放列表ID' }),
  resourceId: z.string({ message: '资源ID' }),
  position: z.number().optional(),
  note: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class UpdatePlayItemsDto extends createZodDto(UpdatePlayItemsSchema) {}

// 删除播放列表项
const DeletePlayItemsSchema = z.object({
  id: z.string({ message: '播放列表项ID' }),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class DeletePlayItemsDto extends createZodDto(DeletePlayItemsSchema) {}

// 获取频道列表
const GetChannelsListSchema = z.object({
  forHandle: z.string().optional(),
  forUsername: z.string().optional(),
  id: z.string().optional(),
  mine: z.boolean().optional(),
  maxResults: z.number().optional(),
  pageToken: z.string().optional(),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class GetChannelsListDto extends createZodDto(GetChannelsListSchema) {}

// 获取频道板块列表
const GetChannelsSectionsListSchema = z.object({
  channelId: z.string().optional(),
  id: z.string().optional(),
  mine: z.boolean().optional(),
  accountId: z.string({ message: '账号ID必须是字符串' }),
})
export class GetChannelsSectionsListDto extends createZodDto(GetChannelsSectionsListSchema) {}

/**
 * YouTube搜索接口DTO
 */
const SearchSchema = z.object({
  accountId: z.string({ message: '账号ID必须是字符串' }),
  forMine: z.boolean().optional(),
  maxResults: z.number().optional(),
  order: z.enum(['relevance', 'date', 'rating', 'title', 'videoCount', 'viewCount']).optional(),
  pageToken: z.string().optional(),
  publishedBefore: z.string().optional(),
  publishedAfter: z.string().optional(),
  q: z.string().optional(),
  type: z.enum(['video', 'channel', 'playlist']).optional(),
  videoCategoryId: z.string().optional(),
})
export class SearchDto extends createZodDto(SearchSchema) {}
