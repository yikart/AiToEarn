/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import {
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { SourceType } from '../comment'

export class CreateBoardBodyDto {
  @ApiProperty({ title: '画板名称', required: true })
  @IsString({ message: '名称' })
  @Expose()
  readonly name: string

  @IsString({ message: '用户信息' })
  @Expose()
  @IsOptional()
  readonly accountId?: string
}

export class ListBodyDto {
  @ApiProperty({ title: '页码', required: false })
  @IsString({ message: '页码' })
  @Expose()
  readonly page: string

  @ApiProperty({ title: '每页大小', required: false })
  @IsString({ message: '每页大小' })
  @Expose()
  readonly size: string

  @IsString({ message: '用户信息' })
  @Expose()
  @IsOptional()
  readonly accountId?: string
}

export class MediaSource {
  @ApiProperty({ title: '媒体类型', required: true })
  @IsString({ message: '媒体类型' })
  @IsOptional()
  @Expose()
  readonly source_type: SourceType

  @ApiProperty({ title: '地址', required: true })
  @IsString({ message: '地址' })
  @Expose()
  @IsOptional()
  readonly url: string
}

export class CreatePinBodyItemDto {
  @ApiProperty({ title: '地址', required: false })
  @IsString({ message: '地址' })
  @Expose()
  @IsOptional()
  readonly url?: string

  @ApiProperty({ title: '标题', required: false })
  @IsString({ message: '标题' })
  @Expose()
  @IsOptional()
  readonly title?: string

  @ApiProperty({ title: '描述', required: false })
  @IsString({ message: '描述' })
  @Expose()
  @IsOptional()
  readonly description?: string

  @ApiProperty({ title: '链接', required: false })
  @IsString({ message: '链接' })
  @Expose()
  @IsOptional()
  readonly link?: string
}

export class CreatePinBodyDto {
  @ApiProperty({ title: '此Pin所属board的板块。' })
  @IsString({ message: '此Pin所属board的板块。' })
  @Expose()
  readonly board_id: string

  @ApiProperty({ title: '点击连接跳转的link', required: false })
  @IsString({ message: '点击连接' })
  @IsOptional()
  @Expose()
  readonly link?: string

  @ApiProperty({ title: '标题', required: false })
  @IsString({ message: '标题' })
  @IsOptional()
  @Expose()
  readonly title?: string

  @ApiProperty({ title: '描述', required: false })
  @IsString({ message: '描述' })
  @Expose()
  @IsOptional()
  description?: string

  @ApiProperty({ title: '描述', required: false })
  @IsString({ message: '描述' })
  @Expose()
  @IsOptional()
  readonly decs?: string

  @ApiProperty({
    title: 'RGB表示的颜色 主引脚颜色。十六进制数，例如“#6E7874”',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'RGB表示的颜色 主引脚颜色。十六进制数，例如“#6E7874”' })
  @Expose()
  readonly dominant_color?: string

  @ApiProperty({ title: '鼠标悬浮描述', required: false })
  @IsString({ message: '鼠标悬浮描述' })
  @IsOptional()
  @Expose()
  readonly alt_text?: string

  @ApiProperty({ title: '媒体来源' })
  @ValidateNested()
  @Type(() => MediaSource)
  @Expose()
  @IsOptional()
  readonly media_source: MediaSource

  @ApiProperty({ title: '点开pin里面包含的图片文案信息' })
  @ValidateNested()
  @Type(() => CreatePinBodyItemDto)
  @Expose()
  @IsOptional()
  readonly items: CreatePinBodyItemDto[]

  @IsString({ message: '用户信息' })
  @Expose()
  @IsOptional()
  readonly accountId?: string
}

export class WebhookDto {
  @IsString({ message: 'code' })
  @Expose()
  @IsOptional()
  readonly code: string

  @IsString({ message: 'state' })
  @Expose()
  @IsOptional()
  readonly state: string
}
