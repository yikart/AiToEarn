/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2024-10-17 19:07:10
 * @LastEditors: nevin
 * @Description: AI工具
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class VideoAiDesDto {
  @ApiProperty({ title: '视频URL', required: true })
  @IsString({ message: '视频URL' })
  @Expose()
  readonly url: string
}

export class ReviewAi {
  @ApiProperty({ title: '标题', required: true })
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @ApiProperty({ title: '描述', required: false })
  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly desc?: string

  @ApiProperty({ title: '最大字数', required: false })
  @IsNumber({ allowNaN: false }, { message: '最大字数' })
  @IsOptional()
  @Expose()
  readonly max?: number
}

export class ReviewImgAi {
  @ApiProperty({ title: '图片链接', required: true })
  @IsString({ message: '图片链接' })
  @Expose()
  readonly imgUrl: string

  @ApiProperty({ title: '标题', required: true })
  @IsString({ message: '标题' })
  @IsOptional()
  @Expose()
  readonly title?: string

  @ApiProperty({ title: '描述', required: false })
  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly desc?: string

  @ApiProperty({ title: '最大字数', required: false })
  @IsNumber({ allowNaN: false }, { message: '最大字数' })
  @IsOptional()
  @Expose()
  readonly max?: number
}

export class ReviewAiRecover {
  @ApiProperty({ title: '评论内容', required: true })
  @IsString({ message: '评论内容' })
  @Expose()
  readonly content: string

  @ApiProperty({ title: '标题', required: false })
  @IsString({ message: '标题' })
  @IsOptional()
  @Expose()
  readonly title?: string

  @ApiProperty({ title: '描述', required: false })
  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly desc?: string

  @ApiProperty({ title: '最大字数', required: false })
  @IsNumber({ allowNaN: false }, { message: '最大字数' })
  @IsOptional()
  @Expose()
  readonly max?: number
}

export class AiArticleHtmlDto {
  @ApiProperty({ title: '内容', required: true })
  @IsString({ message: '内容' })
  @Expose()
  readonly content: string
}

export class AiArticleHtmlTestDto {
  @ApiProperty({ title: '模型', required: true })
  @IsString({ message: '模型' })
  @Expose()
  readonly model: string

  @ApiProperty({ title: '内容', required: true })
  @IsString({ message: '内容' })
  @Expose()
  readonly content: string

  @ApiProperty({ title: '内容', required: true })
  @IsString({ message: '内容' })
  @Expose()
  readonly content2: string
}
