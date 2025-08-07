import { createZodDto } from '@common/utils'
/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: publish
 */
import { ApiProperty } from '@nestjs/swagger'
import { AccountType } from '@transports/account/comment'
import {
  BilibiliPublishOption,
  Copyright,
  NoReprint,
} from '@transports/channel/bilibili.common'
import { PubType } from '@transports/content/common'

import { PublishStatus } from '@transports/plat/publish.natsApi'
import { Expose, Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { z } from 'zod/v4'
import { FacebookPostOptions, InstagramPostOptions, ThreadsPostOptions } from '@/transports/channel/meta.common'
import { WxGzhPublishOption } from '@/transports/channel/wxGzh.common'
import { YoutubePublishOption } from '@/transports/plat/youtube.common'
import { PlatOptons, PublishType } from '../common'

class GzhPublishOptionDto implements WxGzhPublishOption {
  @ApiProperty({
    title: '分区ID',
    required: true,
    description: '由获取分区信息接口得到',
  })
  @IsNumber({ allowNaN: false }, { message: '分区ID' })
  @Expose()
  readonly tid: number // 分区ID，由获取分区信息接口得到
}

class BilibiliPublishOptionDto implements BilibiliPublishOption {
  @ApiProperty({
    title: '分区ID',
    required: true,
    description: '由获取分区信息接口得到',
  })
  @IsNumber({ allowNaN: false }, { message: '分区ID' })
  @Expose()
  readonly tid: number // 分区ID，由获取分区信息接口得到

  @ApiProperty({
    title: '是否允许转载',
    required: true,
    enum: NoReprint,
    description: '0-允许，1-不允许',
  })
  @IsEnum(NoReprint, { message: '类型' })
  @IsOptional()
  @Expose()
  readonly no_reprint?: NoReprint

  @ApiProperty({
    title: '版权',
    required: true,
    enum: Copyright,
    description: '版权',
  })
  @IsEnum(Copyright, { message: '版权' })
  @Expose()
  readonly copyright: Copyright

  @ApiProperty({
    title: '来源',
    description: '如果copyright为转载，则此字段表示转载来源',
    required: true,
  })
  @IsString({ message: '来源' })
  @IsOptional()
  @Expose()
  readonly source?: string
}

enum PrivacyStatus {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
}

class YoutubePublishOptionDto implements YoutubePublishOption {
  @ApiProperty({
    title: '隐私状态',
    required: true,
    enum: PrivacyStatus,
    description: '隐私状态',
  })
  @IsEnum(PrivacyStatus, { message: '隐私状态' })
  @IsOptional()
  @Expose()
  readonly privacyStatus?: PrivacyStatus

  @ApiProperty({
    title: '关键词',
    required: false,
    description: '多个关键词用英文逗号分隔',
  })
  @IsString({ message: '关键词' })
  @IsOptional()
  @Expose()
  readonly tag?: string

  @ApiProperty({
    title: '类别ID',
    required: false,
    description: '类别ID',
  })
  @IsString({ message: '类别ID' })
  @IsOptional()
  @Expose()
  readonly categoryId?: string

  @ApiProperty({
    title: '发布时间',
    required: false,
    description: '发布时间',
  })
  @IsString({ message: '发布时间' })
  @IsOptional()
  @Expose()
  readonly publishAt?: string
}

class FacebookPostOptionsDto implements FacebookPostOptions {
  @ApiProperty({
    title: '内容分类',
    required: false,
    description: '内容分类',
  })
  @IsString({ message: '内容分类' })
  @Expose()
  readonly content_category: string

  @ApiProperty({
    title: '内容标签',
    required: false,
    description: '内容标签',
  })
  @IsArray({ message: '内容标签必须是一个数组' })
  @IsOptional()
  @Expose()
  readonly content_tags?: string[]

  @ApiProperty({
    title: '自定义标签',
    required: false,
    description: '自定义标签',
  })
  @IsArray({ message: '自定义标签必须是一个数组' })
  @IsOptional()
  @Expose()
  readonly custom_labels?: string[]

  @ApiProperty({
    title: '直接分享状态',
    required: false,
    description: '直接分享状态',
  })
  @IsNumber({}, { message: '直接分享状态必须是数字' })
  @IsOptional()
  @Expose()
  readonly direct_share_status?: number

  @ApiProperty({
    title: '是否可嵌入',
    required: false,
    description: '是否可嵌入',
  })
  @IsBoolean({ message: '是否可嵌入必须是布尔值' })
  @IsOptional()
  @Expose()
  readonly embeddable?: boolean
}

class InstagramPostOptionsDto implements InstagramPostOptions {
  @ApiProperty({
    title: '内容分类',
    required: false,
    description: '内容分类',
  })
  @IsString({ message: '内容分类' })
  @Expose()
  readonly content_category: string

  @ApiProperty({ title: '替代文本', required: false })
  @IsString({ message: '替代文本' })
  @IsOptional()
  @Expose()
  readonly alt_text?: string

  @ApiProperty({ title: '标题', required: false })
  @IsString({ message: '标题' })
  @IsOptional()
  @Expose()
  readonly caption?: string

  @ApiProperty({
    title: '协作者',
    required: false,
    description: '协作者列表',
  })
  @IsArray({ message: '协作者必须是一个数组' })
  @IsOptional()
  @Expose()
  readonly collaborators?: string[]

  @ApiProperty({
    title: '封面URL',
    required: false,
    description: '封面图片的URL',
  })
  @IsString({ message: '封面URL' })
  @IsOptional()
  @Expose()
  readonly cover_url?: string

  @ApiProperty({
    title: '图片URL',
    required: false,
    description: '图片的URL',
  })
  @IsString({ message: '图片URL' })
  @IsOptional()
  @Expose()
  readonly image_url?: string

  @ApiProperty({
    title: '位置ID',
    required: false,
    description:
      '位置ID，用于标记发布内容的位置，通常用于地理标签',
  })
  @IsString({ message: '位置ID' })
  @IsOptional()
  @Expose()
  readonly location_id?: string

  @ApiProperty({
    title: '产品标签',
    required: false,
    description: '产品标签列表',
  })
  @IsArray({ message: '产品标签必须是一个数组' })
  @IsOptional()
  @Expose()
  readonly product_tags?: { product_id: string, x: number, y: number }[]

  @ApiProperty({
    title: '用户标签',
    required: false,
    description: '用户标签列表',
  })
  @IsArray({ message: '用户标签必须是一个数组' })
  @IsOptional()
  @Expose()
  readonly user_tags?: { username: string, x: number, y: number }[]
}

class ThreadsPostOptionsDto implements ThreadsPostOptions {
  @ApiProperty({
    title: '回复控制',
    required: false,
    description: '回复控制选项',
  })
  @IsString({ message: '回复控制' })
  @IsOptional()
  @Expose()
  readonly reply_control?: string

  @ApiProperty({
    title: '允许的国家代码',
    required: false,
    description: '允许的国家代码列表',
  })
  @IsArray({ message: '允许的国家代码必须是一个数组' })
  @IsOptional()
  @Expose()
  readonly allowlisted_country_codes?: string[]

  @ApiProperty({
    title: '替代文本',
    required: false,
    description: '替代文本',
  })
  @IsString({ message: '替代文本' })
  @IsOptional()
  @Expose()
  readonly alt_text?: string

  @ApiProperty({
    title: '自动发布文本',
    required: false,
    description: '是否自动发布文本',
  })
  @IsBoolean({ message: '自动发布文本必须是布尔值' })
  @IsOptional()
  @Expose()
  readonly auto_publish_text?: boolean

  @ApiProperty({
    title: '话题标签',
    required: false,
    description: '话题标签列表',
  })
  @IsString({ message: '话题标签' })
  @IsOptional()
  @Expose()
  readonly topic_tags?: string
}

class PublishOptionDto implements PlatOptons {
  @ApiProperty({
    title: 'B站参数',
    required: false,
    description: 'B站参数',
  })
  @ValidateNested()
  @Type(() => BilibiliPublishOptionDto)
  @IsOptional()
  @Expose()
  readonly bilibili?: BilibiliPublishOptionDto

  @ApiProperty({
    title: 'B站参数',
    required: false,
    description: '微信公众号参数',
  })
  @ValidateNested()
  @Type(() => GzhPublishOptionDto)
  @IsOptional()
  @Expose()
  readonly wxGzh?: GzhPublishOptionDto

  @ApiProperty({
    title: 'B站参数',
    required: false,
    description: '微信公众号参数',
  })
  @ValidateNested()
  @Type(() => YoutubePublishOptionDto)
  @IsOptional()
  @Expose()
  readonly youtube?: YoutubePublishOptionDto

  @ApiProperty({
    title: 'Facebook参数',
    required: false,
    description: 'Facebook参数',
  })
  @ValidateNested()
  @Type(() => FacebookPostOptionsDto)
  @IsOptional()
  @Expose()
  readonly facebook?: FacebookPostOptionsDto

  @ApiProperty({
    title: 'Instagram参数',
    required: false,
    description: 'Instagram参数',
  })
  @ValidateNested()
  @Type(() => InstagramPostOptionsDto)
  @IsOptional()
  @Expose()
  readonly instagram?: InstagramPostOptionsDto

  @ApiProperty({
    title: 'Threads参数',
    required: false,
    description: 'Threads参数',
  })
  @ValidateNested()
  @Type(() => ThreadsPostOptionsDto)
  @IsOptional()
  @Expose()
  readonly threads?: ThreadsPostOptionsDto
}

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
    enum: PublishType,
    description: '类型',
  })
  @IsEnum(PublishType, { message: '类型' })
  @Expose()
  readonly type: PublishType

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
    title: '平台类型',
    required: true,
    enum: AccountType,
    description: '平台类型',
  })
  @IsEnum(AccountType, { message: '平台类型' })
  @Expose()
  readonly accountType: AccountType

  @ApiProperty({ title: '视频路径', required: false })
  @IsString({ message: '视频路径' })
  @IsOptional()
  @Expose()
  readonly videoUrl?: string

  @ApiProperty({ title: '封面路径', required: false })
  @IsString({ message: '封面路径' })
  @Expose()
  readonly coverUrl: string

  // 图片列表
  @ApiProperty({ title: '图片列表', required: false })
  @IsArray({ message: '图片列表' })
  @IsOptional()
  @Expose()
  readonly imgUrlList?: string[]

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
    title: '其他配置',
    required: false,
    description: '其他配置',
  })
  @ValidateNested()
  @Type(() => PublishOptionDto)
  @IsOptional()
  @Expose()
  readonly option?: PublishOptionDto
}

export class PubRecordListFilterDto {
  @IsString({ message: '账户ID' })
  @IsOptional()
  @Expose()
  readonly accountId?: string

  @ApiProperty({
    title: '账户类型',
    required: false,
    enum: AccountType,
    description: '账户类型',
  })
  @IsEnum(AccountType, { message: '账户类型' })
  @IsOptional()
  @Expose()
  readonly accountType?: AccountType

  @ApiProperty({
    title: '类型',
    required: false,
    enum: PubType,
    description: '类型',
  })
  @IsEnum(PubType, { message: '类型' })
  @IsOptional()
  @Expose()
  readonly type?: PubType

  @ApiProperty({
    title: '状态',
    required: false,
    enum: PublishStatus,
    description: '状态',
  })
  @IsEnum(PublishStatus, { message: '状态' })
  @IsOptional()
  @Expose()
  readonly status?: PublishStatus

  @ApiProperty({ title: '创建时间区间，必须为UTC时间', required: false })
  @IsArray({ message: '创建时间区间必须是一个数组' })
  @ArrayMinSize(2, { message: '创建时间区间必须包含两个日期' })
  @ArrayMaxSize(2, { message: '创建时间区间必须包含两个日期' })
  @IsDate({ each: true, message: '创建时间区间中的每个元素必须是有效的日期' })
  @IsOptional()
  @Expose()
  @Transform(({ value }) =>
    value ? value.map((v: string) => new Date(v)) : undefined,
  )
  readonly time?: [Date, Date]
}

export class UpdatePublishRecordTimeDto {
  @ApiProperty({ title: '数据ID' })
  @Expose()
  id: string

  @ApiProperty({ title: '新的发布时间' })
  @IsDate({ message: '新的发布时间必须是有效的日期，日期为UTC时间' })
  @Transform(({ value }) =>
    value ? value.map((v: string) => new Date(v)) : undefined,
  )
  @Expose()
  publishTime: Date
}

export const createPublishRecordSchema = z.object({
  flowId: z.string().optional(),
  dataId: z.string(),
  type: z.nativeEnum(PublishType),
  title: z.string().optional(),
  desc: z.string().optional(),
  accountId: z.string(),
  topics: z.array(z.string()),
  accountType: z.nativeEnum(AccountType),
  uid: z.string(),
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgUrlList: z.array(z.string()).optional(),
  publishTime: z.union([z.date(), z.string().datetime()]).transform(arg => new Date(arg)),
  imgList: z.array(z.string()).optional(),
  errorMsg: z.string().optional(),
  option: z.any(),
})
export class CreatePublishRecordDto extends createZodDto(createPublishRecordSchema) {}
