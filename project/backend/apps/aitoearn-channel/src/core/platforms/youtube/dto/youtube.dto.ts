import { createZodDto } from '@yikart/common'
import { z } from 'zod'

// 定义类型
export interface YoutubePlaylistSnippet {
  title?: string
  description?: string
  defaultLanguage?: string
}

export interface YoutubePlaylistStatus {
  privacyStatus?: string
  podcastStatus?: string
}

export interface YouTubeAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

const UserIdSchema = z.object({
  userId: z.string().describe('用户ID'),
})
export class UserIdDto extends createZodDto(UserIdSchema) {}

const GetAuthUrlSchema = UserIdSchema.extend({
  spaceId: z.string().describe('空间ID'),
  mail: z.email().describe('邮箱'),
  prefix: z.string().optional().describe('前缀'),
})
export class GetAuthUrlDto extends createZodDto(GetAuthUrlSchema) {}

const GetAuthInfoSchema = z.object({
  taskId: z.string().describe('任务ID'),
})
export class GetAuthInfoDto extends createZodDto(GetAuthInfoSchema) {}

const AccountIdSchema = z.object({
  accountId: z.string().describe('账号ID'),
})
export class AccountIdDto extends createZodDto(AccountIdSchema) {}

const VideoCategoriesSchema = AccountIdSchema.extend({
  id: z.string().optional().describe('视频类别ID'),
  regionCode: z.string().optional().describe('区域代码'),
})
export class VideoCategoriesDto extends createZodDto(VideoCategoriesSchema) {}

const VideosListSchema = AccountIdSchema.extend({
  chart: z.string().optional().describe('图表'),
  id: z.string().optional().describe('视频类别ID'),
  myRating: z.coerce.boolean().optional().describe('是否喜欢'),
  maxResults: z.coerce.number().optional().describe('最大结果数'),
  pageToken: z.string().optional().describe('分页令牌'),
})
export class VideosListDto extends createZodDto(VideosListSchema) {}

const CreateAccountAndSetAccessTokenSchema = z.object({
  taskId: z.string().describe('任务ID'),
  code: z.string().describe('授权码'),
  state: z.string().describe('状态'),
})
export class CreateAccountAndSetAccessTokenDto extends createZodDto(
  CreateAccountAndSetAccessTokenSchema,
) {}

const UploadVideoSchema = AccountIdSchema.extend({
  fileBuffer: z.instanceof(Buffer).describe('视频文件 Buffer'),
  fileName: z.string().describe('文件名'),
  title: z.string().describe('标题'),
  description: z.string().describe('描述'),
  privacyStatus: z.string().describe('隐私状态'),
  keywords: z.string().optional().describe('关键词'),
  categoryId: z.string().optional().describe('分类 ID'),
})
export class UploadVideoDto extends createZodDto(UploadVideoSchema) {}

const UploadLitVideoSchema = AccountIdSchema.extend({
  file: z.string().describe('文件流 base64 编码'),
  uploadToken: z.string().describe('上传 token'),
})
export class UploadLitVideoDto extends createZodDto(UploadLitVideoSchema) {}

const UploadVideoPartSchema = AccountIdSchema.extend({
  fileBase64: z.string().describe('文件流 base64 编码'),
  uploadToken: z.string().describe('上传 token'),
  partNumber: z.coerce.number().describe('分片索引'),
})
export class UploadVideoPartDto extends createZodDto(UploadVideoPartSchema) {}

const VideoCompleteSchema = AccountIdSchema.extend({
  uploadToken: z.string().describe('上传 token'),
  totalSize: z.coerce.number().describe('文件总大小'),
})
export class VideoCompleteDto extends createZodDto(VideoCompleteSchema) {}

const InitUploadVideoSchema = AccountIdSchema.extend({
  title: z.string().describe('标题'),
  description: z.string().describe('描述'),
  privacyStatus: z.string().describe('隐私状态'),
  tag: z.string().optional().describe('标签'),
  categoryId: z.string().optional().describe('分类 ID'),
  contentLength: z.coerce.number().optional().describe('内容长度'),
  license: z.string().optional().describe('许可证'),
  embeddable: z.boolean().optional().describe('是否可嵌入'),
  notifySubscribers: z.boolean().optional().describe('是否通知订阅者'),
  selfDeclaredMadeForKids: z.boolean().optional().describe('是否自认为适合儿童'),
})
export class InitUploadVideoDto extends createZodDto(InitUploadVideoSchema) {}

// 获取频道列表
const GetChannelsListSchema = AccountIdSchema.extend({
  forHandle: z.string().optional().describe('频道 handle, 注意：forHandle、forUsername、id、mine 必须有且只能有一个'),
  forUsername: z.string().optional().describe('用户名'),
  id: z.string().optional().describe('频道ID'),
  mine: z.coerce.boolean().describe('是否查询当前频道'),
  maxResults: z.coerce.number().optional().describe('最大结果数'),
  pageToken: z.string().optional().describe('分页令牌'),
})
export class GetChannelsListDto extends createZodDto(GetChannelsListSchema) {}

const UpdateChannelsSchema = AccountIdSchema.extend({
  id: z.string().describe('频道ID'),
  handle: z.string().optional().describe('handle'),
  userName: z.string().optional().describe('用户名'),
  mine: z.coerce.boolean().describe('是否当前频道'),
})
export class UpdateChannelsDto extends createZodDto(UpdateChannelsSchema) {}

const GetCommentsListSchema = AccountIdSchema.extend({
  id: z.string().optional().describe('评论ID（多个以逗号分隔）'),
  parentId: z.string().optional().describe('顶级评论ID'),
  maxResults: z.coerce.number().optional().describe('最大结果数'),
  pageToken: z.string().optional().describe('分页令牌'),
})
export class GetCommentsListDto extends createZodDto(GetCommentsListSchema) {}

const InsertCommentThreadsSchema = AccountIdSchema.extend({
  channelId: z.string().describe('频道ID'),
  videoId: z.string().describe('视频ID'),
  textOriginal: z.string().describe('评论内容'),
})
export class InsertCommentThreadsDto extends createZodDto(InsertCommentThreadsSchema) {}

const GetCommentThreadsListSchema = AccountIdSchema.extend({
  id: z.string().optional().describe('评论会话ID'),
  allThreadsRelatedToChannelId: z.string().optional().describe('关联频道ID'),
  videoId: z.string().optional().describe('视频ID'),
  maxResults: z.coerce.number().optional().describe('最大结果数'),
  pageToken: z.string().optional().describe('分页令牌'),
  order: z.string().optional().describe('排序方式'),
  searchTerms: z.string().optional().describe('搜索关键词'),
})
export class GetCommentThreadsListDto extends createZodDto(GetCommentThreadsListSchema) {}

const InsertCommentSchema = AccountIdSchema.extend({
  parentId: z.string().optional().describe('父评论ID'),
  textOriginal: z.string().optional().describe('评论内容'),
})
export class InsertCommentDto extends createZodDto(InsertCommentSchema) {}

const UpdateCommentSchema = AccountIdSchema.extend({
  id: z.string().optional().describe('评论ID'),
  textOriginal: z.string().optional().describe('评论内容'),
})
export class UpdateCommentDto extends createZodDto(UpdateCommentSchema) {}

const SetCommentThreadsModerationStatusSchema = AccountIdSchema.extend({
  id: z.string().describe('评论ID'),
  moderationStatus: z.string().describe('审核状态'),
  banAuthor: z.coerce.boolean().describe('是否自动拒绝评论作者'),
})
export class SetCommentThreadsModerationStatusDto extends createZodDto(
  SetCommentThreadsModerationStatusSchema,
) {}

const DeleteCommentSchema = AccountIdSchema.extend({
  id: z.string().describe('评论ID'),
})
export class DeleteCommentDto extends createZodDto(DeleteCommentSchema) {}

const VideoRateSchema = AccountIdSchema.extend({
  id: z.string().describe('视频ID'),
  rating: z.string().describe('点赞、踩'),
})
export class VideoRateDto extends createZodDto(VideoRateSchema) {}

// 获取视频的点赞、踩
const GetVideoRateSchema = AccountIdSchema.extend({
  id: z.string().describe('视频ID，多个id用英文逗号分隔'),
})
export class GetVideoRateDto extends createZodDto(GetVideoRateSchema) {}

// 删除视频
const DeleteVideoSchema = AccountIdSchema.extend({
  id: z.string().describe('视频ID'),
})
export class DeleteVideoDto extends createZodDto(DeleteVideoSchema) {}

// 更新视频
const UpdateVideoSchema = AccountIdSchema.extend({
  id: z.string().describe('视频ID'),
  title: z.string().describe('标题'),
  categoryId: z.string().describe('类别ID'),
  defaultLanguage: z.string().optional().describe('默认语言'),
  description: z.string().optional().describe('描述'),
  privacyStatus: z.string().optional().describe('隐私状态'),
  tags: z.string().optional().describe('标签'),
  publishAt: z.string().optional().describe('发布时间'),
  recordingDate: z.string().optional().describe('录制日期'),
})
export class UpdateVideoDto extends createZodDto(UpdateVideoSchema) {}

const InsertPlayListSchema = AccountIdSchema.extend({
  title: z.string().describe('标题'),
  description: z.string().optional().describe('描述'),
  privacyStatus: z.string().optional().describe('隐私状态'),
})
export class InsertPlayListDto extends createZodDto(InsertPlayListSchema) {}

const GetPlayListSchema = AccountIdSchema.extend({
  channelId: z.string().optional().describe('频道ID'),
  id: z.string().optional().describe('播放列表 ID, 注意：channelId、id、mine，必须有且只能有一个'),
  mine: z.coerce.boolean().describe('是否查询我的播放列表'),
  maxResults: z.coerce.number().optional().describe('最大结果数'),
  pageToken: z.string().optional().describe('分页令牌'),
})
export class GetPlayListDto extends createZodDto(GetPlayListSchema) {}

const UpdatePlayListSchema = AccountIdSchema.extend({
  id: z.string().describe('播放列表 ID'),
  title: z.string().optional().describe('标题'),
  description: z.string().optional().describe('描述'),
  privacyStatus: z.string().optional().describe('隐私状态'),
  podcastStatus: z.string().optional().describe('播客状态'),
})
export class UpdatePlayListDto extends createZodDto(UpdatePlayListSchema) {}

const DeletePlayListSchema = AccountIdSchema.extend({
  id: z.string().describe('播放列表 ID'),
})
export class DeletePlayListDto extends createZodDto(DeletePlayListSchema) {}

const GetPlayItemsSchema = AccountIdSchema.extend({
  id: z.string().optional().describe('播放列表项 ID 多个id用英文逗号分隔，注意：id、playlistId，必须有且只能有一个'),
  playlistId: z.string().optional().describe('播放列表 ID'),
  maxResults: z.coerce.number().optional().describe('最大结果数'),
  pageToken: z.string().optional().describe('分页令牌'),
  videoId: z.string().optional().describe('视频 ID'),
})
export class GetPlayItemsDto extends createZodDto(GetPlayItemsSchema) {}

const InsertPlayItemsSchema = AccountIdSchema.extend({
  playlistId: z.string().describe('播放列表 ID'),
  resourceId: z.string().describe('资源 ID'),
  position: z.coerce.number().optional().describe('位置'),
  note: z.string().optional().describe('说明'),
  startAt: z.string().optional().describe('开始时间'),
  endAt: z.string().optional().describe('结束时间'),
})
export class InsertPlayItemsDto extends createZodDto(InsertPlayItemsSchema) {}

const UpdatePlayItemsSchema = InsertPlayItemsSchema.extend({
  id: z.string().describe('播放列表项 ID'),
})
export class UpdatePlayItemsDto extends createZodDto(UpdatePlayItemsSchema) {}

const DeletePlayItemsSchema = AccountIdSchema.extend({
  id: z.string().describe('播放列表项 ID'),
})
export class DeletePlayItemsDto extends createZodDto(DeletePlayItemsSchema) {}

const ChannelsSectionsListSchema = AccountIdSchema.extend({
  channelId: z.string().optional().describe('频道 ID, 注意：channelId、id、mine，必须有且只能有一个'),
  id: z.string().optional().describe('板块 ID'),
  mine: z.coerce.boolean().describe('是否查询自己的板块'),
})
export class ChannelsSectionsListDto extends createZodDto(ChannelsSectionsListSchema) {}

const SearchSchema = AccountIdSchema.extend({
  forMine: z.coerce.boolean().describe('是否搜索我的内容'),
  maxResults: z.coerce.number().optional().describe('最大结果数'),
  order: z
    .enum(['relevance', 'date', 'rating', 'title', 'videoCount', 'viewCount'])
    .optional()
    .describe('排序方法'),
  pageToken: z.string().optional().describe('分页令牌'),
  publishedBefore: z.string().optional().describe('发布时间之前'),
  publishedAfter: z.string().optional().describe('发布时间之后'),
  q: z.string().optional().describe('搜索查询字词'),
  type: z.enum(['video', 'channel', 'playlist']).optional().describe('搜索类型'),
  videoCategoryId: z.string().optional().describe('视频类别 ID'),
})
export class SearchDto extends createZodDto(SearchSchema) {}
