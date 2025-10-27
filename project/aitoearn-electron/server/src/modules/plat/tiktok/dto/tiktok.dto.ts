import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVideoDto {
  @ApiProperty({ description: 'TikTok账号ID' })
  @IsString()
  accountId: string;

  @ApiProperty({ description: '视频描述/标题' })
  @IsString()
  description: string;

  @ApiProperty({ description: '视频是否为私有', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  private?: boolean;

  @ApiProperty({ description: '视频话题标签列表', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  hashtags?: string[];
}

export class TikTokCommentDto {
  @ApiProperty({ description: 'TikTok账号ID' })
  @IsString()
  accountId: string;

  @ApiProperty({ description: '视频ID' })
  @IsString()
  videoId: string;

  @ApiProperty({ description: '评论内容' })
  @IsString()
  text: string;
}

export class GetVideosQueryDto {
  @ApiProperty({ description: 'TikTok账号ID' })
  @IsString()
  accountId: string;

  @ApiProperty({ description: '每页结果数', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: '用于分页的游标', required: false })
  @IsString()
  @IsOptional()
  cursor?: string;
}

export class TikTokVideoFilterDto {
  @ApiProperty({ description: 'TikTok账号ID' })
  @IsString()
  accountId: string;

  @ApiProperty({ description: '关键词搜索', required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ description: '最低播放次数', required: false })
  @IsNumber()
  @IsOptional()
  minPlayCount?: number;

  @ApiProperty({ description: '每页结果数', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: '用于分页的游标', required: false })
  @IsString()
  @IsOptional()
  cursor?: string;
}

export interface TikTokOAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  open_id: string;
}

export interface TikTokUser {
  open_id: string;
  union_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio_description: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

export class CombinedVideoUploadDto {
  @ApiProperty({ description: 'TikTok账号ID' })
  @IsString()
  accountId: string;

  @ApiProperty({ description: '视频标题', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '视频描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '隐私级别', required: false, default: 'PUBLIC', enum: ['PUBLIC', 'PRIVATE', 'FRIENDS'] })
  @IsString()
  @IsOptional()
  privacyStatus?: string;

  @ApiProperty({ description: '是否禁用评论', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  disableComment?: boolean;
  
  @ApiProperty({ description: '是否禁用二重奏', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  disableDuet?: boolean;

  @ApiProperty({ description: '是否禁用Stitch', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  disableStitch?: boolean;

  @ApiProperty({ description: '视频封面时间点（毫秒）', required: false })
  @IsNumber()
  @IsOptional()
  videoCoverTimestampMs?: number;

  @ApiProperty({ description: '话题标签列表', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: '轮询间隔（毫秒）', required: false, default: 2000 })
  @IsNumber()
  @IsOptional()
  pollInterval?: number;

  @ApiProperty({ description: '最大重试次数', required: false, default: 30 })
  @IsNumber()
  @IsOptional()
  maxRetries?: number;
}
