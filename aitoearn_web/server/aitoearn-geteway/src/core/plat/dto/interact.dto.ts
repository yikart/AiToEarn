/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: interact
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'

export class AddArcCommentDto {
  @ApiProperty({
    title: '账号ID',
    required: true,
    description: '账号ID',
  })
  @IsString({ message: '账号ID' })
  @Expose()
  readonly accountId: string

  @ApiProperty({
    title: '作品ID',
    required: true,
    description: '作品ID',
  })
  @IsString({ message: '作品ID' })
  @Expose()
  readonly dataId: string

  @ApiProperty({
    title: '内容',
    required: true,
    description: '内容',
  })
  @IsString({ message: '内容' })
  @Expose()
  readonly content: string
}

export class ReplyCommentDto {
  @ApiProperty({
    title: '账号ID',
    required: true,
    description: '账号ID',
  })
  @IsString({ message: '账号ID' })
  @Expose()
  readonly accountId: string

  @ApiProperty({
    title: '评论ID',
    required: true,
    description: '评论ID',
  })
  @IsString({ message: '评论ID' })
  @Expose()
  readonly commentId: string

  @ApiProperty({
    title: '内容',
    required: true,
    description: '内容',
  })
  @IsString({ message: '内容' })
  @Expose()
  readonly content: string
}

export class DelCommentDto {
  @ApiProperty({
    title: '账号ID',
    required: true,
    description: '账号ID',
  })
  @IsString({ message: '账号ID' })
  @Expose()
  readonly accountId: string

  @ApiProperty({
    title: '评论ID',
    required: true,
    description: '评论ID',
  })
  @IsString({ message: '评论ID' })
  @Expose()
  readonly commentId: string
}
