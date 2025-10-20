import { ApiProperty } from '@nestjs/swagger'
import { Expose, Transform, Type } from 'class-transformer'
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'

/**
 * 账号ID DTO
 */
export class AccountIdDto {
  @ApiProperty({ description: '账号ID' })
  @IsString({ message: '账号ID必须是字符串' })
  @Expose()
  readonly accountId: string
}

/**
 * 获取视频类别列表 DTO
 * 注意：id和regionCode只能选择一个
 */
export class GetVideoCategoriesDto extends AccountIdDto {
  @ApiProperty({
    description: '视频类别ID, 注意：id和regionCode必须有且只能选择一个',
    required: false,
  })
  @IsString({
    message: '视频类别ID必须是字符串, 注意：id和regionCode必须有且只能选择一个',
  })
  @IsOptional()
  @Expose()
  readonly id?: string

  @ApiProperty({
    description: '区域代码, 注意：id和regionCode只能选择一个',
    required: false,
  })
  @IsString({
    message: '区域代码必须是字符串, 注意：id和regionCode只能选择一个',
  })
  @IsOptional()
  @Expose()
  readonly regionCode?: string
}

/**
 * 获取视频列表 DTO
 */
export class GetVideosListDto extends AccountIdDto {
  @ApiProperty({
    description:
      '用于标识您要检索的图表。这里只有一个值，mostPopular – 返回指定内容区域和视频类别中最热门的视频。id、myRating、chart这三个参数必须且只能选一个',
    required: false,
  })
  @IsString({ message: '图表' })
  @IsOptional()
  @Expose()
  readonly chart?: string

  @ApiProperty({
    description:
      '视频ID, 多个id用英文逗号分隔。注意:id、myRating、chart这三个参数必须且只能选一个',
    required: false,
  })
  @IsString({ message: '视频ID必须是字符串' })
  @IsOptional()
  @Expose()
  readonly id?: string

  @ApiProperty({
    description:
      '是否获取我喜欢的视频, 注意:id、myRating、chart这三个参数必须且只能选一个',
    required: false,
  })
  @IsBoolean({ message: 'myRating必须是布尔值' })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly myRating?: boolean

  @ApiProperty({ description: '最大返回结果数', required: false })
  @IsNumber({}, { message: 'maxResults必须是数字' })
  @IsOptional()
  @Type(() => Number)
  @Expose()
  readonly maxResults?: number

  @ApiProperty({ description: '分页令牌', required: false })
  @IsString({ message: 'pageToken必须是字符串' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string
}

/**
 * 上传小视频(小于20MB) DTO
 */
export class UploadSmallVideoDto extends AccountIdDto {
  @ApiProperty({ description: '视频标题' })
  @IsString({ message: '标题必须是字符串' })
  @Expose()
  readonly title: string

  @ApiProperty({ description: '视频描述' })
  @IsString({ message: '描述必须是字符串' })
  @Expose()
  readonly description: string

  @ApiProperty({
    description: '隐私状态',
    enum: ['public', 'private', 'unlisted'],
  })
  @IsString({ message: '隐私状态必须是字符串' })
  @Expose()
  readonly privacyStatus: string

  @ApiProperty({
    description: '关键词，多个关键词用英文逗号分隔',
    required: false,
  })
  @IsString({ message: '关键词必须是字符串, 多个关键词用逗号分隔' })
  @IsOptional()
  @Expose()
  readonly keywords?: string

  @ApiProperty({ description: '视频类别ID', required: false })
  @IsString({ message: '视频类别ID必须是字符串' })
  @IsOptional()
  @Expose()
  readonly categoryId?: string

  @ApiProperty({
    description: '发布时间, 符合 ISO 8601 标准的日期时间字符串',
    required: false,
  })
  @IsString({
    message:
      '发布时间必须是字符串符合 ISO 8601 标准的日期时间字符串,例如:"2025-07-15T14:30:00Z"  // 2025年7月15日 14:30:00 UTC时间"2025-07-15T14:30:00+08:00"  // 2025年7月15日 14:30:00 东八区时间',
  })
  @IsOptional()
  @Expose()
  readonly publishAt?: string
}

/**
 * 初始化视频上传 DTO
 */
export class InitVideoUploadDto extends AccountIdDto {
  @ApiProperty({ description: '视频标题' })
  @IsString({ message: '标题必须是字符串' })
  @Expose()
  readonly title: string

  @ApiProperty({ description: '视频描述' })
  @IsString({ message: '描述必须是字符串' })
  @Expose()
  readonly description: string

  @ApiProperty({
    description: '关键词, 多个关键词用英文逗号分隔',
    required: false,
  })
  @IsString({ message: '关键词必须是字符串, 多个关键词用逗号分隔' })
  @IsOptional()
  @Expose()
  readonly keywords?: string

  @ApiProperty({ description: '视频类别ID', required: false })
  @IsString({ message: '视频类别ID必须是字符串' })
  @IsOptional()
  @Expose()
  readonly categoryId?: string

  @ApiProperty({
    description: '隐私状态',
    enum: ['public', 'private', 'unlisted'],
  })
  @IsString({ message: '隐私状态必须是字符串' })
  @Expose()
  readonly privacyStatus: string

  @ApiProperty({
    description: '发布时间，符合ISO 8601标准的日期时间字符串',
    required: false,
  })
  @IsString({
    message:
      '发布时间必须是字符串符合 ISO 8601 标准的日期时间字符串,例如:"2025-07-15T14:30:00Z"  // 2025年7月15日 14:30:00 UTC时间"2025-07-15T14:30:00+08:00"  // 2025年7月15日 14:30:00 东八区时间',
  })
  @IsOptional()
  @Expose()
  readonly publishAt?: string

  @ApiProperty({ description: '视频文件总大小，字节数', required: true })
  @IsNumber({ allowNaN: false }, { message: '视频文件总大小，字节数' })
  @Type(() => Number)
  @Expose()
  readonly contentLength: number
}

/**
 * 上传视频分片 DTO
 */
export class UploadVideoPartDto extends AccountIdDto {
  @ApiProperty({ title: '上传token', required: true })
  @IsString({ message: '上传token' })
  @Expose()
  readonly uploadToken: string

  @ApiProperty({ title: '分片索引', required: true })
  @IsNumber(
    { allowNaN: false },
    {
      message: '分片索引',
    },
  )
  @Type(() => Number)
  @Expose()
  readonly partNumber: number
}

/**
 * 完成视频上传 DTO
 */
export class UploadVideoCompleteDto extends AccountIdDto {
  @ApiProperty({ description: '上传令牌' })
  @IsString({ message: '上传令牌必须是字符串' })
  @Expose()
  readonly uploadToken: string

  @ApiProperty({ description: '视频文件总大小，字节数', required: true })
  @IsNumber({ allowNaN: false }, { message: '视频文件总大小，字节数' })
  @Type(() => Number)
  @Expose()
  readonly totalSize: number
}

/**
 * 获取子评论列表 DTO
 */
export class GetCommentsListDto extends AccountIdDto {
  @ApiProperty({
    description:
      '评论ID，多个id用英文逗号分隔，注意：id和 parentId 必须有且只能有其中一个',
  })
  @IsString({ message: '评论ID必须是字符串' })
  @IsOptional()
  @Expose()
  readonly id: string

  @ApiProperty({
    description: '父评论ID，注意：id和 parentId 必须有且只能有其中一个',
    required: false,
  })
  @IsString({ message: '父评论ID必须是字符串' })
  @IsOptional()
  @Expose()
  readonly parentId?: string

  @ApiProperty({ description: '最大返回结果数', required: false })
  @IsNumber({}, { message: 'maxResults必须是数字' })
  @IsOptional()
  @Type(() => Number)
  @Expose()
  readonly maxResults?: number

  @ApiProperty({ description: '分页令牌', required: false })
  @IsString({ message: 'pageToken必须是字符串' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string
}

// 创建顶级评论
export class InsertCommentThreadsDto extends AccountIdDto {
  @ApiProperty({ description: '频道ID', required: true })
  @IsString({ message: '频道ID必须是字符串' })
  @Expose()
  readonly channelId: string

  @ApiProperty({ description: '视频ID', required: true })
  @IsString({ message: '视频ID必须是字符串' })
  @Expose()
  readonly videoId: string

  @ApiProperty({ description: '评论内容', required: true })
  @IsString({ message: '评论内容必须是字符串' })
  @Expose()
  readonly textOriginal: string
}

// 获取评论会话列表
export class GetCommentThreadsListDto extends AccountIdDto {
  @ApiProperty({
    description:
      '评论会话ID,多个id以英文逗号隔开，注意：id、allThreadsRelatedToChannelId、videoId 必须有且只能有一个，不能同时使用',
    required: false,
  })
  @IsString({ message: '评论会话 ID' })
  @Expose()
  @IsOptional()
  readonly id?: string

  @ApiProperty({
    description:
      '关联的频道ID。注意：id、allThreadsRelatedToChannelId、videoId 必须有且只能有一个，不能同时使用',
    required: false,
  })
  @IsString({ message: '关联的频道ID' })
  @Expose()
  @IsOptional()
  readonly allThreadsRelatedToChannelId?: string

  @ApiProperty({
    description:
      '视频ID 注意：id、allThreadsRelatedToChannelId、videoId 必须有且只能有一个，不能同时使用',
    required: false,
  })
  @IsString({ message: '视频ID' })
  @Expose()
  @IsOptional()
  readonly videoId?: string

  @IsNumber({ allowNaN: false }, { message: '最大结果数' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly maxResults?: number

  @ApiProperty({
    description: '分页令牌，注意：此参数不能与 id 参数结合使用。',
    required: false,
  })
  @IsString({ message: '分页令牌' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string

  @ApiProperty({
    description:
      '排序方式，注意：此参数不能与 id 参数结合使用。time - 默认，评论会话会按时间排序。relevance - 评论会话按相关性排序。',
    enum: ['time', 'relevance'],
    required: false,
  })
  @IsString({ message: '排序方式' })
  @IsOptional()
  @Expose()
  readonly order?: string

  @ApiProperty({
    description: '搜索关键词，注意：此参数不能与 id 参数结合使用。',
    required: false,
  })
  @IsString({ message: '搜索关键词' })
  @IsOptional()
  @Expose()
  readonly searchTerms?: string
}

// 定义 topLevelComment.snippet 的子类
export class SecondLevelCommentSnippetDto {
  @ApiProperty({
    description: '评论内容, 注意：textOriginal 和 parentId 必须有且只能有一个',
    required: false,
  })
  @IsString({ message: '评论内容' })
  @IsOptional()
  @Expose()
  readonly textOriginal: string

  @ApiProperty({
    description: '父评论ID， 注意：textOriginal 和 parentId 必须有且只能有一个',
    required: false,
  })
  @IsString({ message: '父评论ID' })
  @IsOptional()
  @Expose()
  readonly parentId: string
}

// 创建二级评论
export class InsertCommentDto extends AccountIdDto {
  @ApiProperty({
    description: '评论内容, 注意：textOriginal 和 parentId 必须有且只能有一个',
    required: false,
  })
  @IsString({ message: '评论内容' })
  @IsOptional()
  @Expose()
  readonly textOriginal: string

  @ApiProperty({
    description: '父评论ID， 注意：textOriginal 和 parentId 必须有且只能有一个',
    required: false,
  })
  @IsString({ message: '父评论ID' })
  @IsOptional()
  @Expose()
  readonly parentId: string
}

// 更新评论
export class UpdateCommentDto extends AccountIdDto {
  @ApiProperty({
    description: '评论ID',
    required: true,
  })
  @IsString({ message: '评论ID' })
  @Expose()
  readonly id: string

  @ApiProperty({
    description: '评论内容',
    required: true,
  })
  @IsString({ message: '评论内容必须是字符串' })
  @IsOptional()
  @Expose()
  readonly textOriginal: string
}

// 设置评论审核状态
export class SetCommentThreadsModerationStatusDto extends AccountIdDto {
  @ApiProperty({
    description: '评论ID',
    required: true,
  })
  @IsString({ message: '评论ID' })
  @Expose()
  readonly id: string

  @ApiProperty({
    description:
      '审核状态,heldForReview 等待管理员审核   published - 清除要公开显示的评论。 rejected - 不显示该评论',
    enum: ['heldForReview', 'published', 'rejected'],
  })
  @IsString({ message: '审核状态' })
  @Expose()
  readonly moderationStatus: string

  @ApiProperty({
    description: '是否自动拒绝评论作者撰写的任何其他评论 将作者加入黑名单,',
    required: false,
  })
  @IsBoolean({
    message: '是否自动拒绝评论作者撰写的任何其他评论 将作者加入黑名单,',
  })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly banAuthor?: boolean
}

// 删除评论
export class DeleteCommentDto extends AccountIdDto {
  @ApiProperty({
    description: '评论ID',
    required: true,
  })
  @IsString({ message: '评论ID' })
  @Expose()
  readonly id: string
}

// 对视频的点赞、踩
export class VideoRateDto extends AccountIdDto {
  @ApiProperty({
    description: '视频ID',
    required: true,
  })
  @IsString({ message: '视频ID' })
  @Expose()
  readonly id: string

  @ApiProperty({
    description: '点赞、踩  like/dislike/none ',
    enum: ['like', 'dislike', 'none'],
  })
  @IsString({ message: '点赞、踩 like/dislike/none' })
  @Expose()
  readonly rating: string
}

// 获取视频的点赞、踩
export class GetVideoRateDto extends AccountIdDto {
  @ApiProperty({
    description: '视频ID，多个id用英文逗号分隔',
    required: true,
  })
  @IsString({ message: '视频ID' })
  @Expose()
  readonly id: string
}

// 删除视频
export class DeleteVideoDto extends AccountIdDto {
  @ApiProperty({
    description: '视频ID',
    required: true,
  })
  @IsString({ message: '视频ID' })
  @Expose()
  readonly id: string
}

// 更新视频
export class UpdateVideoDto extends AccountIdDto {
  @ApiProperty({
    description: '视频ID',
    required: true,
  })
  @IsString({ message: '视频ID' })
  @Expose()
  readonly id: string

  @ApiProperty({
    description: '标题',
    required: true,
  })
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @ApiProperty({
    description: '类别ID',
    required: true,
  })
  @IsString({ message: '类别ID' })
  @Expose()
  readonly categoryId: string

  @ApiProperty({
    description: '默认语言',
    required: false,
  })
  @IsString({ message: '默认语言' })
  @IsOptional()
  @Expose()
  readonly defaultLanguage: string

  @ApiProperty({
    description: '描述',
    required: false,
  })
  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly description: string

  @ApiProperty({
    description: '隐私状态',
    required: false,
  })
  @IsString({ message: '隐私状态' })
  @IsOptional()
  @Expose()
  readonly privacyStatus: string

  @ApiProperty({
    description: '标签',
    required: false,
  })
  @IsString({ message: '标签' })
  @IsOptional()
  @Expose()
  readonly tags?: string

  @ApiProperty({
    description: '发布时间',
    required: false,
  })
  @IsString({ message: '发布时间' })
  @IsOptional()
  @Expose()
  readonly publishAt?: string

  @ApiProperty({
    description: '录制日期',
    required: false,
  })
  @IsString({ message: '录制日期' })
  @IsOptional()
  @Expose()
  readonly recordingDate?: string
}

// 创建播放列表
export class InsertPlayListDto extends AccountIdDto {
  @ApiProperty({
    description: '标题',
    required: true,
  })
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @ApiProperty({
    description: '描述',
    required: false,
  })
  @IsOptional()
  @Expose()
  readonly description?: string

  @ApiProperty({
    description: '隐私状态',
    required: false,
  })
  @IsString({ message: '隐私状态' })
  @IsOptional()
  @Expose()
  readonly privacyStatus?: string
}

// 获取播放列表
export class GetPlayListDto extends AccountIdDto {
  @ApiProperty({
    description: '频道ID',
    required: false,
  })
  @IsString({ message: '频道ID' })
  @IsOptional()
  @Expose()
  readonly channelId?: string

  @ApiProperty({
    description: '播放列表ID',
    required: false,
  })
  @IsOptional()
  @Expose()
  readonly id?: string

  @ApiProperty({
    description: '我的播放列表',
    required: false,
  })
  @ApiProperty({
    description: '我的播放列表',
    required: false,
  })
  @IsBoolean({ message: '我的播放列表' })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly mine?: boolean

  @ApiProperty({
    description: '最大结果数',
    required: false,
  })
  @IsNumber({ allowNaN: false }, { message: '最大结果数' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly maxResults?: number

  @ApiProperty({
    description: '分页令牌',
    required: false,
  })
  @IsString({ message: '分页令牌' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string
}

// 更新播放列表
export class UpdatePlayListDto extends AccountIdDto {
  @ApiProperty({
    description: '播放列表ID',
    required: true,
  })
  @IsString({ message: '播放列表ID' })
  @Expose()
  readonly id: string

  @ApiProperty({
    description: '标题',
    required: true,
  })
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @ApiProperty({
    description: '描述',
    required: false,
  })
  @IsOptional()
  @Expose()
  readonly description?: string

  @ApiProperty({
    description: '隐私状态',
    required: false,
  })
  @IsOptional()
  @Expose()
  readonly privacyStatus?: string

  @ApiProperty({
    description: '播客状态',
    required: false,
  })
  @IsString({ message: '播客状态' })
  @IsOptional()
  @Expose()
  readonly podcastStatus?: string
}

// 删除播放列表
export class DeletePlayListDto extends AccountIdDto {
  @ApiProperty({
    description: '播放列表ID',
    required: true,
  })
  @IsString({ message: '播放列表ID' })
  @Expose()
  readonly id: string
}

// 获取播放列表项
export class GetPlayItemsDto extends AccountIdDto {
  @ApiProperty({
    description: '播放列表ID',
    required: false,
  })
  @IsString({ message: '播放列表ID' })
  @Expose()
  readonly id?: string

  @ApiProperty({
    description: '我的播放列表',
    required: false,
  })
  @ApiProperty({
    description: '我的播放列表',
    required: false,
  })
  @IsBoolean({ message: '我的播放列表' })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly playlistId?: string

  @ApiProperty({
    description: '最大结果数',
    required: false,
  })
  @IsNumber({ allowNaN: false }, { message: '最大结果数' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly maxResults?: number

  @ApiProperty({
    description: '分页令牌',
    required: false,
  })
  @IsString({ message: '分页令牌' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string

  @ApiProperty({
    description: '视频ID',
    required: false,
  })
  @IsString({ message: '视频ID' })
  @IsOptional()
  @Expose()
  readonly videoId?: string
}

// 插入播放列表项
export class InsertPlayItemsDto extends AccountIdDto {
  @ApiProperty({
    description: '播放列表ID',
    required: true,
  })
  @IsString({ message: '播放列表ID' })
  @Expose()
  readonly playlistId: string

  @ApiProperty({
    description: '资源ID',
    required: true,
  })
  @IsString({ message: '资源ID' })
  @Expose()
  readonly resourceId: string

  @ApiProperty({
    description: '位置',
    required: false,
  })
  @IsNumber({ allowNaN: false }, { message: '位置' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly position?: number

  @ApiProperty({
    description: '说明',
    required: false,
  })
  @IsString({ message: '说明' })
  @IsOptional()
  @Expose()
  readonly note?: string

  @ApiProperty({
    description: '开始时间',
    required: false,
  })
  @ApiProperty({
    description: '开始时间',
    required: false,
  })
  @IsString({ message: '开始时间' })
  @IsOptional()
  @Expose()
  readonly startAt?: string

  @ApiProperty({
    description: '结束时间',
    required: false,
  })
  @IsString({ message: '结束时间' })
  @IsOptional()
  @Expose()
  readonly endAt?: string
}

// 更新播放列表项
export class UpdatePlayItemsDto extends AccountIdDto {
  @ApiProperty({
    description: '播放列表项ID',
    required: true,
  })
  @IsString({ message: '播放列表项ID' })
  @Expose()
  readonly id: string

  @ApiProperty({
    description: '播放列表ID',
    required: true,
  })
  @IsString({ message: '播放列表ID' })
  @Expose()
  readonly playlistId: string

  @ApiProperty({
    description: '资源ID',
    required: true,
  })
  @IsString({ message: '资源ID' })
  @Expose()
  readonly resourceId: string

  @ApiProperty({
    description: '位置',
    required: false,
  })
  @IsNumber({ allowNaN: false }, { message: '位置' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly position?: number

  @ApiProperty({
    description: '说明',
    required: false,
  })
  @IsString({ message: '说明' })
  @IsOptional()
  @Expose()
  readonly note?: string

  @ApiProperty({
    description: '开始时间',
    required: false,
  })
  @IsOptional()
  @Expose()
  readonly startAt?: string

  @ApiProperty({
    description: '结束时间',
    required: false,
  })
  @IsString({ message: '结束时间' })
  @IsOptional()
  @Expose()
  readonly endAt?: string
}

// 删除播放列表项
export class DeletePlayItemsDto extends AccountIdDto {
  @ApiProperty({
    description: '播放列表项ID',
    required: true,
  })
  @IsString({ message: '播放列表项ID' })
  @Expose()
  readonly id: string
}

// 获取频道列表
export class GetChannelsListDto extends AccountIdDto {
  @ApiProperty({
    description:
      '标识名,注意：forHandle、forUsername、id、mine 必须有且只能有一个',
    required: false,
  })
  @IsString({
    message: '标识名,注意：forHandle、forUsername、id、mine 必须有且只能有一个',
  })
  @IsOptional()
  @Expose()
  readonly forHandle?: string

  @ApiProperty({
    description:
      '用户名,注意：forHandle、forUsername、id、mine 必须有且只能有一个',
    required: false,
  })
  @IsString({
    message: '用户名,注意：forHandle、forUsername、id、mine 必须有且只能有一个',
  })
  @IsOptional()
  @Expose()
  readonly forUsername?: string

  @ApiProperty({
    description:
      '频道ID,注意：forHandle、forUsername、id、mine 必须有且只能有一个',
    required: false,
  })
  @IsString({
    message: '频道ID,注意：forHandle、forUsername、id、mine 必须有且只能有一个',
  })
  @IsOptional()
  @Expose()
  readonly id?: string

  @ApiProperty({
    description:
      '我的频道,注意：forHandle、forUsername、id、mine 必须有且只能有一个',
    required: false,
  })
  @IsBoolean({
    message:
      '我的频道,注意：forHandle、forUsername、id、mine 必须有且只能有一个',
  })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly mine?: boolean

  @ApiProperty({
    description: '最大结果数',
    required: false,
  })
  @IsNumber({ allowNaN: false }, { message: '最大结果数' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly maxResults?: number

  @ApiProperty({
    description: '分页令牌',
    required: false,
  })
  @IsString({ message: '分页令牌' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string
}

// 获取频道板块列表
export class GetChannelsSectionsListDto extends AccountIdDto {
  @ApiProperty({
    description: '频道ID, 注意：channelId、id、mine，必须有且只能有一个',
    required: false,
  })
  @IsString({
    message: '频道ID, 注意：channelId、id、mine，必须有且只能有一个',
  })
  @IsOptional()
  @Expose()
  readonly channelId?: string

  @ApiProperty({
    description:
      '板块ID, 多个id用英文逗号分隔，注意：channelId、id、mine，必须有且只能有一个',
    required: false,
  })
  @IsString({
    message:
      '板块ID, 多个id用英文逗号分隔，注意：channelId、id、mine，必须有且只能有一个',
  })
  @IsOptional()
  @Expose()
  readonly id?: string

  @ApiProperty({
    description:
      '是否查询自己的板块, 注意：channelId、id、mine，必须有且只能有一个',
    required: false,
  })
  @IsBoolean({
    message:
      '是否查询自己的板块, 注意：channelId、id、mine，必须有且只能有一个',
  })
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsOptional()
  @Expose()
  readonly mine?: boolean
}

/**
 * YouTube搜索接口DTO
 */
export class SearchDto {
  @ApiProperty({ description: '账号ID', example: 'account_123' })
  @IsString({ message: '账号ID必须是字符串' })
  @Expose()
  readonly accountId: string

  @ApiProperty({ description: '是否搜索我的内容', required: false, example: false })
  @IsBoolean({ message: '是否搜索我的内容必须是布尔值' })
  @IsOptional()
  @Expose()
  readonly forMine?: boolean

  @ApiProperty({ description: '最大结果数', required: false, example: 10 })
  @IsNumber({}, { message: '最大结果数必须是数字' })
  @IsOptional()
  @Expose()
  readonly maxResults?: number

  @ApiProperty({
    description: '排序方法',
    required: false,
    enum: ['relevance', 'date', 'rating', 'title', 'videoCount', 'viewCount'],
    example: 'relevance',
  })
  @IsString({ message: '排序方法必须是字符串' })
  @IsOptional()
  @Expose()
  readonly order?: 'relevance' | 'date' | 'rating' | 'title' | 'videoCount' | 'viewCount'

  @ApiProperty({ description: '分页令牌', required: false, example: 'next_page_token' })
  @IsString({ message: '分页令牌必须是字符串' })
  @IsOptional()
  @Expose()
  readonly pageToken?: string

  @ApiProperty({ description: '发布时间之前', required: false, example: '2024-01-01T00:00:00Z' })
  @IsString({ message: '发布时间之前必须是字符串' })
  @IsOptional()
  @Expose()
  readonly publishedBefore?: string

  @ApiProperty({ description: '发布时间之后', required: false, example: '2024-01-01T00:00:00Z' })
  @IsString({ message: '发布时间之后必须是字符串' })
  @IsOptional()
  @Expose()
  readonly publishedAfter?: string

  @ApiProperty({ description: '搜索查询字词', required: false, example: '编程教程' })
  @IsString({ message: '搜索查询字词必须是字符串' })
  @IsOptional()
  @Expose()
  readonly q?: string

  @ApiProperty({
    description: '搜索类型',
    required: false,
    enum: ['video', 'channel', 'playlist'],
    example: 'video',
  })
  @IsString({ message: '搜索类型必须是字符串' })
  @IsOptional()
  @Expose()
  readonly type?: 'video' | 'channel' | 'playlist'

  @ApiProperty({ description: '视频类别ID', required: false, example: '22' })
  @IsString({ message: '视频类别ID必须是字符串' })
  @IsOptional()
  @Expose()
  readonly videoCategoryId?: string
}
