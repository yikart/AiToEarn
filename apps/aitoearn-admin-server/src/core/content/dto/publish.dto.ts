/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: publish
 */
import { ApiProperty } from '@nestjs/swagger'
import { AccountType } from '@yikart/mongodb'
import { Expose, Transform } from 'class-transformer'
import {
  IsArray,
  IsDate,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'
import { PubStatus, PubType } from '../../../transports/content/common'

export class CreatePublishDto {
  @ApiProperty({
    title: '流水ID',
    required: true,
    description: '流水ID--使用UUID',
  })
  @IsString({ message: '流水ID' })
  @Expose()
  readonly flowId: string

  @ApiProperty({
    title: '类型',
    required: true,
    enum: PubType,
    description: '类型',
  })
  @IsEnum(PubType, { message: '类型' })
  @Expose()
  readonly type: PubType

  @ApiProperty({ title: '标题', required: true })
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @ApiProperty({ title: '内容', required: true })
  @IsString({ message: '内容' })
  @IsOptional()
  @Expose()
  readonly desc: string

  @ApiProperty({ title: '账户ID', required: true })
  @IsString({ message: '账户ID' })
  @Expose()
  readonly accountId: string

  @ApiProperty({
    title: '账户类型',
    required: true,
    enum: AccountType,
    description: '账户类型',
  })
  @IsEnum(AccountType, { message: '账户类型' })
  @Expose()
  readonly accountType: AccountType

  @ApiProperty({ title: '账户平台ID', required: true })
  @IsString({ message: '账户平台ID' })
  @Expose()
  readonly uid: string

  @ApiProperty({ title: '视频路径', required: false })
  @IsString({ message: '视频路径' })
  @IsOptional()
  @Expose()
  readonly videoUrl?: string

  @ApiProperty({ title: '封面路径，展示给前台用', required: false })
  @IsString({ message: '封面路径，展示给前台用' })
  @IsOptional()
  @Expose()
  readonly coverUrl?: string

  // 图片列表
  @ApiProperty({ title: '图片列表', required: false })
  @IsArray({ message: '图片列表' })
  @IsOptional()
  @Expose()
  readonly imgList?: string[]

  @ApiProperty({ title: '发布日期', required: false })
  @IsDate({ message: '发布日期必须是有效的日期' })
  @Transform(({ value }) => {
    if (!value)
      return undefined
    return new Date(value)
  })
  @IsOptional()
  @Expose()
  readonly publishTime?: Date

  @ApiProperty({
    title: '发布状态',
    required: false,
    enum: PubStatus,
    description: '发布状态',
  })
  @IsEnum(PubStatus, { message: '发布状态' })
  @IsOptional()
  @Expose()
  readonly status?: PubStatus

  @ApiProperty({ title: '其他配置', required: false })
  @IsObject({ message: '其他配置' })
  @IsOptional()
  @Expose()
  readonly option?: any
}
