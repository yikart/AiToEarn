import { Expose, Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator'
/*
 * @Author: nevin
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: nevin
 * @Description: TikTok DTO
 */
import { TiktokPostMode, TiktokPrivacyLevel, TiktokSourceType } from '../../../../libs/tiktok/tiktok.enum'

// 发布信息DTO
export class PostInfoDto {
  @IsString()
  @IsOptional()
  @Expose()
  readonly title?: string

  @IsString()
  @IsOptional()
  @Expose()
  readonly description?: string

  @IsEnum(TiktokPrivacyLevel)
  @Expose()
  readonly privacy_level: TiktokPrivacyLevel

  @IsBoolean()
  @IsOptional()
  @Expose()
  readonly disable_comment?: boolean

  @IsBoolean()
  @IsOptional()
  @Expose()
  readonly disable_duet?: boolean

  @IsBoolean()
  @IsOptional()
  @Expose()
  readonly disable_stitch?: boolean

  @IsBoolean()
  @IsOptional()
  @Expose()
  readonly auto_add_music?: boolean

  @IsBoolean()
  @IsOptional()
  @Expose()
  readonly brand_content_toggle?: boolean

  @IsBoolean()
  @IsOptional()
  @Expose()
  readonly brand_organic_toggle?: boolean

  @IsNumber()
  @IsOptional()
  @Expose()
  readonly video_cover_timestamp_ms?: number
}

// 视频源信息DTO - 文件上传方式
export class VideoFileUploadSourceDto {
  @IsEnum(TiktokSourceType)
  @Expose()
  readonly source: TiktokSourceType.FILE_UPLOAD

  @IsNumber()
  @Expose()
  readonly video_size: number

  @IsNumber()
  @Expose()
  readonly chunk_size: number

  @IsNumber()
  @Expose()
  readonly total_chunk_count: number
}

// 视频源信息DTO - URL拉取方式
export class VideoPullUrlSourceDto {
  @IsEnum(TiktokSourceType)
  @Expose()
  readonly source: TiktokSourceType.PULL_FROM_URL

  @IsUrl()
  @Expose()
  readonly video_url: string
}

// 照片源信息DTO
export class PhotoSourceInfoDto {
  @IsEnum(TiktokSourceType)
  @Expose()
  readonly source: TiktokSourceType.PULL_FROM_URL

  @IsArray()
  @IsUrl({}, { each: true })
  @Expose()
  readonly photo_images: string[]

  @IsNumber()
  @Expose()
  readonly photo_cover_index: number
}

export class AccountIdDto {
  @IsString()
  @Expose()
  readonly accountId: string
}

export class UserIdDto {
  @IsString()
  @Expose()
  readonly userId: string
}

export class GetAuthUrlDto extends UserIdDto {
  @IsString()
  @Expose()
  readonly spaceId: string

  @IsArray()
  @IsOptional()
  @Expose()
  readonly scopes?: string[]
}

export class GetAuthInfoDto {
  @IsString()
  @Expose()
  readonly taskId: string
}

export class CreateAccountAndSetAccessTokenDto {
  @IsString()
  @Expose()
  readonly code: string

  @IsString()
  @Expose()
  readonly state: string
}

export class RefreshTokenDto extends AccountIdDto {
  @IsString()
  @Expose()
  readonly refreshToken: string
}

export class VideoPublishDto extends AccountIdDto {
  @ValidateNested()
  @Type(() => PostInfoDto)
  @Expose()
  readonly postInfo: PostInfoDto

  @ValidateNested()
  @Type(() => Object, {
    discriminator: {
      property: 'source',
      subTypes: [
        { value: VideoFileUploadSourceDto, name: TiktokSourceType.FILE_UPLOAD },
        { value: VideoPullUrlSourceDto, name: TiktokSourceType.PULL_FROM_URL },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  @Expose()
  readonly sourceInfo: VideoFileUploadSourceDto | VideoPullUrlSourceDto
}

export class PhotoPublishDto extends AccountIdDto {
  @IsEnum(TiktokPostMode)
  @Expose()
  readonly postMode: TiktokPostMode

  @ValidateNested()
  @Type(() => PostInfoDto)
  @Expose()
  readonly postInfo: PostInfoDto

  @ValidateNested()
  @Type(() => PhotoSourceInfoDto)
  @Expose()
  readonly sourceInfo: PhotoSourceInfoDto
}

export class GetPublishStatusDto extends AccountIdDto {
  @IsString()
  @Expose()
  readonly publishId: string
}

export class UploadVideoFileDto {
  @IsString()
  @Expose()
  readonly uploadUrl: string

  @IsString()
  @Expose()
  readonly videoBase64: string

  @IsString()
  @IsOptional()
  @Expose()
  readonly contentType?: string
}

export class UserInfoDto extends AccountIdDto {
  @IsString()
  @IsOptional()
  @Expose()
  readonly fields?: string
}

export class ListUserVideosDto extends AccountIdDto {
  @IsString()
  @Expose()
  readonly fields: string

  @IsNumber()
  @IsOptional()
  @Expose()
  readonly cursor?: number

  @IsNumber()
  @IsOptional()
  @Expose()
  readonly max_count?: number
}

export class RevokeTokenDto extends AccountIdDto {}
