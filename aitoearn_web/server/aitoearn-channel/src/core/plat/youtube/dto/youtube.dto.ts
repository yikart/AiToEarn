import { Expose, Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'

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

export class UserIdDto {
  @IsString({ message: '用户ID' })
  @Expose()
  readonly userId: string
}

export class GetAuthUrlDto extends UserIdDto {
  @IsString({ message: '类型 pc h5' })
  @Expose()
  readonly type: 'h5' | 'pc'

  @IsEmail({}, { message: '邮箱' })
  @Expose()
  readonly mail: string

  @IsString({ message: '前缀' })
  @IsOptional()
  @Expose()
  readonly prefix?: string
}

export class GetAuthInfoDto {
  @IsString({ message: '任务ID' })
  @Expose()
  readonly taskId: string
}

export class AccountIdDto {
  @IsString({ message: '账号ID' })
  @Expose()
  readonly accountId: string
}

export class VideoCategoriesDto extends AccountIdDto {
  @IsString({ message: '视频类别id' })
  @IsOptional()
  @Expose()
  readonly id?: string

  @IsString({ message: '区域代码' })
  @IsOptional()
  @Expose()
  readonly regionCode?: string
}

export class VideosListDto extends AccountIdDto {
  @IsString({ message: '图表' })
  @IsOptional()
  @Expose()
  readonly chart?: string

  @IsString({ message: '视频类别id' })
  @IsOptional()
  @Expose()
  readonly id?: string

  @IsBoolean({ message: '是否喜欢' })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly myRating?: boolean

  @IsNumber({}, { message: '最大结果数' })
  @IsOptional()
  @Expose()
  readonly maxResults?: number

  @IsString({ message: '分页令牌' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string
}

export class CreateAccountAndSetAccessTokenDto {
  @IsString({ message: '任务ID' })
  @Expose()
  readonly taskId: string

  @IsString({ message: '授权码' })
  @Expose()
  readonly code: string

  @IsString({ message: '状态' })
  @Expose()
  readonly state: string
}

export class UploadVideoDto extends AccountIdDto {
  @IsObject({ message: '视频文件Buffer' })
  @Expose()
  readonly fileBuffer: Buffer

  @IsString({ message: '文件名' })
  @Expose()
  readonly fileName: string

  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @IsString({ message: '描述' })
  @Expose()
  readonly description: string

  @IsString({ message: '隐私状态' })
  @Expose()
  readonly privacyStatus: string

  @IsString({ message: '关键词' })
  @IsOptional()
  @Expose()
  readonly keywords?: string

  @IsString({ message: '类别ID' })
  @IsOptional()
  @Expose()
  readonly categoryId?: string

  @IsString({ message: '发布时间' })
  @IsOptional()
  @Expose()
  readonly publishAt?: string
}

export class UploadLitVideoDto extends AccountIdDto {
  @IsString({ message: '文件流 base64编码' })
  @Expose()
  readonly file: string

  @IsString({ message: '上传token' })
  @Expose()
  readonly uploadToken: string
}

export class UploadVideoPartDto extends AccountIdDto {
  @IsString({ message: '文件流 base64编码' })
  @Expose()
  readonly fileBase64: string

  @IsString({ message: '上传token' })
  @Expose()
  readonly uploadToken: string

  @IsNumber({ allowNaN: false }, { message: '分片索引' })
  @Type(() => Number) // 关键在这里，确保类型转换
  @Expose()
  readonly partNumber: number
}

export class VideoCompleteDto extends AccountIdDto {
  @IsString({ message: '上传token' })
  @Expose()
  readonly uploadToken: string

  @IsNumber({ allowNaN: false }, { message: '文件总大小' })
  @Type(() => Number)
  @Expose()
  readonly totalSize: number
}

export class InitUploadVideoDto extends AccountIdDto {
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @IsString({ message: '描述' })
  @Expose()
  readonly description: string

  @IsString({ message: '隐私状态' })
  @Expose()
  readonly privacyStatus: string

  @IsString({ message: '关键词' })
  @IsOptional()
  @Expose()
  readonly tag?: string

  @IsString({ message: '类别ID' })
  @IsOptional()
  @Expose()
  readonly categoryId?: string

  @IsString({ message: '发布时间' })
  @IsOptional()
  @Expose()
  readonly publishAt?: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Expose()
  readonly contentLength?: number
}

// 获取频道列表
export class GetChannelsListDto extends AccountIdDto {
  @IsString({ message: '标识名,注意：forHandle、forUsername、id、mine 必须有且只能有一个' })
  @IsOptional()
  @Expose()
  readonly forHandle?: string

  @IsString({ message: '用户名,注意：forHandle、forUsername、id、mine 必须有且只能有一个' })
  @IsOptional()
  @Expose()
  readonly forUsername?: string

  @IsString({ message: '频道ID,注意：forHandle、forUsername、id、mine 必须有且只能有一个' })
  @IsOptional()
  @Expose()
  readonly id?: string

  @IsBoolean({ message: '我的频道,注意：forHandle、forUsername、id、mine 必须有且只能有一个' })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly mine?: boolean

  @IsNumber({ allowNaN: false }, { message: '最大结果数' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly maxResults?: number

  @IsString({ message: '分页令牌' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string
}

export class UpdateChannelsDto extends AccountIdDto {
  @IsString({ message: '频道ID' })
  @Expose()
  readonly id: string

  @IsString({ message: 'handle' })
  @IsOptional()
  @Expose()
  readonly handle?: string

  @IsString({ message: '用户名' })
  @IsOptional()
  @Expose()
  readonly userName?: string

  @IsString({ message: 'mine' })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly mine?: boolean
}

export class GetCommentsListDto extends AccountIdDto {
  @IsString({ message: '评论ID，多个id用英文逗号分隔，注意：id、parentId,必须有且只能有一个' })
  @IsOptional()
  @Expose()
  readonly id: string

  @IsString({ message: '顶级评论ID。注意：id、parentId,必须有且只能有一个' })
  @IsOptional()
  @Expose()
  readonly parentId?: string

  @IsNumber({ allowNaN: false }, { message: '最大结果数' })
  @Type(() => Number)
  @Expose()
  readonly maxResults?: number

  @IsString({ message: '分页令牌' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string
}

// 创建顶级评论（评论会话）
export class InsertCommentThreadsDto extends AccountIdDto {
  @IsString({ message: '频道ID' })
  @Expose()
  readonly channelId: string

  @IsString({ message: '视频ID' })
  @Expose()
  readonly videoId: string

  @IsString({ message: '评论内容' })
  @Expose()
  readonly textOriginal: string
}

// 获取评论会话列表
export class GetCommentThreadsListDto extends AccountIdDto {
  @IsString({ message: '评论会话 ID（多个id以英文逗号分隔）注意：id、allThreadsRelatedToChannelId、videoId 必须有且只能有一个，不能同时使用' })
  @Expose()
  @IsOptional()
  readonly id?: string

  @IsString({ message: '关联的频道ID 注意：id、allThreadsRelatedToChannelId、videoId 必须有且只能有一个，不能同时使用' })
  @Expose()
  @IsOptional()
  readonly allThreadsRelatedToChannelId?: string

  @IsString({ message: '视频ID 注意：id、allThreadsRelatedToChannelId、videoId 必须有且只能有一个，不能同时使用' })
  @Expose()
  @IsOptional()
  readonly videoId?: string

  @IsNumber({ allowNaN: false }, { message: '最大结果数' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly maxResults?: number

  @IsString({ message: '分页令牌，注意：此参数不能与 id 参数结合使用。' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string

  @IsString({ message: '排序方式，注意：此参数不能与 id 参数结合使用。time - 默认，评论会话会按时间排序。relevance - 评论会话按相关性排序。' })
  @IsOptional()
  @Expose()
  readonly order?: string

  @IsString({ message: '搜索关键词，注意：此参数不能与 id 参数结合使用。' })
  @IsOptional()
  @Expose()
  readonly searchTerms?: string
}

// 创建二级评论
export class InsertCommentDto extends AccountIdDto {
  @IsString({ message: '父评论ID' })
  @IsOptional()
  @Expose()
  readonly parentId: string

  @IsString({ message: '评论内容' })
  @IsOptional()
  @Expose()
  readonly textOriginal: string
}

// 更新评论
export class UpdateCommentDto extends AccountIdDto {
  @IsString({ message: '评论ID' })
  @IsOptional()
  @Expose()
  readonly id: string

  @IsString({ message: '评论内容必须是字符串' })
  @IsOptional()
  @Expose()
  readonly textOriginal: string
}

// 设置评论审核状态
export class SetCommentThreadsModerationStatusDto extends AccountIdDto {
  @IsString({ message: '评论ID' })
  @Expose()
  readonly id: string

  @IsString({ message: '审核状态,heldForReview 等待管理员审核   published - 清除要公开显示的评论。 rejected - 不显示该评论' })
  @Expose()
  readonly moderationStatus: string

  @IsBoolean({ message: '是否自动拒绝评论作者撰写的任何其他评论 将作者加入黑名单,' })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly banAuthor?: boolean
}

// 删除评论
export class DeleteCommentDto extends AccountIdDto {
  @IsString({ message: '评论ID' })
  @Expose()
  readonly id: string
}

// 对视频的点赞、踩
export class VideoRateDto extends AccountIdDto {
  @IsString({ message: '视频ID' })
  @Expose()
  readonly id: string

  @IsString({ message: '点赞、踩 like/dislike/none' })
  @Expose()
  readonly rating: string
}

// 获取视频的点赞、踩
export class GetVideoRateDto extends AccountIdDto {
  @IsString({ message: '视频ID，多个id用英文逗号分隔' })
  @Expose()
  readonly id: string
}

// 删除视频
export class DeleteVideoDto extends AccountIdDto {
  @IsString({ message: '视频ID' })
  @Expose()
  readonly id: string
}

// 更新视频
export class UpdateVideoDto extends AccountIdDto {
  @IsString({ message: '视频ID' })
  @Expose()
  readonly id: string

  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @IsString({ message: '类别ID' })
  @Expose()
  readonly categoryId: string

  @IsString({ message: '默认语言' })
  @IsOptional()
  @Expose()
  readonly defaultLanguage: string

  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly description: string

  @IsString({ message: '隐私状态' })
  @IsOptional()
  @Expose()
  readonly privacyStatus: string

  @IsString({ message: '标签' })
  @IsOptional()
  @Expose()
  readonly tags?: string

  @IsString({ message: '发布时间' })
  @IsOptional()
  @Expose()
  readonly publishAt?: string

  @IsString({ message: '录制日期' })
  @IsOptional()
  @Expose()
  readonly recordingDate?: string
}

// 创建播放列表
export class InsertPlayListDto extends AccountIdDto {
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly description?: string

  @IsString({ message: '隐私状态' })
  @IsOptional()
  @Expose()
  readonly privacyStatus?: string
}

// 获取播放列表
export class GetPlayListDto extends AccountIdDto {
  @IsString({ message: '频道ID, 注意：channelId、id、mine，必须有且只能有一个' })
  @IsOptional()
  @Expose()
  readonly channelId?: string

  @IsString({ message: '播放列表ID, 多个id用英文逗号分隔，注意：channelId、id、mine，必须有且只能有一个' })
  @IsOptional()
  @Expose()
  readonly id?: string

  @IsBoolean({ message: '我的播放列表, 注意：channelId、id、mine，必须有且只能有一个' })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly mine?: boolean

  @IsNumber({ allowNaN: false }, { message: '最大结果数' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly maxResults?: number

  @IsString({ message: '分页令牌' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string
}

// 更新播放列表
export class UpdatePlayListDto extends AccountIdDto {
  @IsString({ message: '播放列表ID' })
  @Expose()
  readonly id: string

  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly description?: string

  @IsString({ message: '隐私状态' })
  @IsOptional()
  @Expose()
  readonly privacyStatus?: string

  @IsString({ message: '播客状态' })
  @IsOptional()
  @Expose()
  readonly podcastStatus?: string
}

// 删除播放列表
export class DeletePlayListDto extends AccountIdDto {
  @IsString({ message: '播放列表ID' })
  @Expose()
  readonly id: string
}

// 获取播放列表项
export class GetPlayItemsDto extends AccountIdDto {
  @IsString({ message: '播放列表项ID, 多个id用英文逗号分隔，注意：id、playlistId，必须有且只能有一个' })
  @IsOptional()
  @Expose()
  readonly id?: string

  @IsString({ message: '播放列表ID, 注意：id、playlistId，必须有且只能有一个' })
  @IsOptional()
  @Expose()
  readonly playlistId?: string

  @IsNumber({ allowNaN: false }, { message: '最大结果数' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly maxResults?: number

  @IsString({ message: '分页令牌' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string

  @IsString({ message: '视频ID' })
  @IsOptional()
  @Expose()
  readonly videoId?: string
}

// 插入播放列表项
export class InsertPlayItemsDto extends AccountIdDto {
  @IsString({ message: '播放列表ID' })
  @Expose()
  readonly playlistId: string

  @IsString({ message: '资源ID' })
  @Expose()
  readonly resourceId: string

  @IsNumber({ allowNaN: false }, { message: '位置' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly position?: number

  @IsString({ message: '说明' })
  @IsOptional()
  @Expose()
  readonly note?: string

  @IsString({ message: '开始时间' })
  @IsOptional()
  @Expose()
  readonly startAt?: string

  @IsString({ message: '结束时间' })
  @IsOptional()
  @Expose()
  readonly endAt?: string
}

// 更新播放列表项
export class UpdatePlayItemsDto extends AccountIdDto {
  @IsString({ message: '播放列表项ID' })
  @Expose()
  readonly id: string

  @IsString({ message: '播放列表ID' })
  @Expose()
  readonly playlistId: string

  @IsString({ message: '资源ID' })
  @Expose()
  readonly resourceId: string

  @IsNumber({ allowNaN: false }, { message: '位置' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly position?: number

  @IsString({ message: '说明' })
  @IsOptional()
  @Expose()
  readonly note?: string

  @IsString({ message: '开始时间' })
  @IsOptional()
  @Expose()
  readonly startAt?: string

  @IsString({ message: '结束时间' })
  @IsOptional()
  @Expose()
  readonly endAt?: string
}

// 删除播放列表项
export class DeletePlayItemsDto extends AccountIdDto {
  @IsString({ message: '播放列表项ID' })
  @Expose()
  readonly id: string
}

// 获取频道板块列表
export class ChannelsSectionsListDto extends AccountIdDto {
  @IsString({ message: '频道ID, 注意：channelId、id、mine，必须有且只能有一个' })
  @IsOptional()
  @Expose()
  readonly channelId?: string

  @IsString({ message: '板块ID, 多个id用英文逗号分隔，注意：channelId、id、mine，必须有且只能有一个' })
  @IsOptional()
  @Expose()
  readonly id?: string

  @IsBoolean({ message: '是否查询自己的板块, 注意：channelId、id、mine，必须有且只能有一个' })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly mine?: boolean
}
