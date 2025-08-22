/*
 * @Author: AI Assistant
 * @Date: 2025-01-08 00:00:00
 * @LastEditTime: 2025-01-08 00:00:00
 * @LastEditors: AI Assistant
 * @Description: TikTok Platform DTO
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import {
  IsObject,
  IsString,
} from 'class-validator'

export class GetAuthUrlDto {
  @ApiProperty({ title: '权限范围', required: false, type: [String], nullable: true })
  @Expose()
  readonly scopes?: string[]
}

export class GetAuthInfoDto {
  @ApiProperty({ title: '任务ID', required: true })
  @IsString({ message: '任务ID不能为空' })
  @Expose()
  readonly taskId: string
}

export class CreateAccountAndSetAccessTokenDto {
  @ApiProperty({ title: '授权码', required: true })
  @IsString({ message: '授权码不能为空' })
  @Expose()
  readonly code: string

  @ApiProperty({ title: '状态码', required: true })
  @IsString({ message: '状态码不能为空' })
  @Expose()
  readonly state: string
}

export class AccountIdDto {
  @ApiProperty({ title: '账户ID', required: true })
  @IsString({ message: '账号ID不能为空' })
  @Expose()
  readonly accountId: string
}

export class RefreshTokenDto extends AccountIdDto {
  @ApiProperty({ title: '刷新令牌', required: true })
  @IsString({ message: '刷新令牌不能为空' })
  @Expose()
  readonly refreshToken: string
}

export class VideoPublishDto extends AccountIdDto {
  @ApiProperty({ title: '发布信息', required: true })
  @IsObject({ message: '发布信息必须是对象' })
  @Expose()
  readonly postInfo: any

  @ApiProperty({ title: '源信息', required: true })
  @IsObject({ message: '源信息必须是对象' })
  @Expose()
  readonly sourceInfo: any
}

export class PhotoPublishDto extends AccountIdDto {
  @ApiProperty({ title: '发布模式', required: true })
  @IsString({ message: '发布模式不能为空' })
  @Expose()
  readonly postMode: string

  @ApiProperty({ title: '发布信息', required: true })
  @IsObject({ message: '发布信息必须是对象' })
  @Expose()
  readonly postInfo: any

  @ApiProperty({ title: '源信息', required: true })
  @IsObject({ message: '源信息必须是对象' })
  @Expose()
  readonly sourceInfo: any
}

export class GetPublishStatusDto extends AccountIdDto {
  @ApiProperty({ title: '发布ID', required: true })
  @IsString({ message: '发布ID不能为空' })
  @Expose()
  readonly publishId: string
}

export class UploadVideoFileDto {
  @ApiProperty({ title: '上传URL', required: true })
  @IsString({ message: '上传URL不能为空' })
  @Expose()
  readonly uploadUrl: string

  @ApiProperty({ title: '内容类型', required: true })
  @IsString({ message: '内容类型不能为空' })
  @Expose()
  readonly contentType: string
}
