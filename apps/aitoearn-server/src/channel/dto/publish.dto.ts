import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from '@yikart/common'
import { AccountType, PublishStatus, PublishType } from '@yikart/mongodb'
import { Expose, Transform } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'
import { z } from 'zod'
import { PublishingChannel } from '../../transports/channel/common'

export const CreatePublishSchema = z.object({
  flowId: z.string({ message: '流水ID' }).optional(),
  accountId: z.string({ message: '账户ID' }),
  accountType: z.nativeEnum(AccountType, { message: '平台类型' }),
  type: z.nativeEnum(PublishType, { message: '类型' }),
  title: z.string().optional(),
  desc: z.string().optional(),
  userTaskId: z.string({ message: '用户任务ID' }).optional(), // 用户任务ID
  taskMaterialId: z.string({ message: '任务素材ID' }).optional(), // 任务素材ID
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgUrlList: z.array(z.string()).optional(),
  publishTime: z
    .union([z.date(), z.string().datetime({ offset: true })])
    .transform(arg => new Date(arg)),
  topics: z.array(z.string()),
  option: z.any().optional(),
})
export class CreatePublishDto extends createZodDto(CreatePublishSchema) {}

export class PubRecordListFilterDto {
  @ApiProperty({
    title: '账户ID',
    required: false,
    description: '账户ID',
  })
  @IsString({ message: '账户ID' })
  @IsOptional()
  @Expose()
  readonly accountId?: string

  @ApiProperty({
    title: '第三方平台账户id',
    required: false,
    description: '第三方平台账户id',
  })
  @IsString({ message: '第三方平台账户id' })
  @IsOptional()
  @Expose()
  readonly uid?: string

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
    enum: PublishType,
    description: '类型',
  })
  @IsEnum(PublishType, { message: '类型' })
  @IsOptional()
  @Expose()
  readonly type?: PublishType

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

  @ApiProperty({
    title: '发布渠道',
    required: false,
    enum: PublishingChannel,
    description: '发布渠道，通过我们内部系统发布的(internal)或平台原生端(native)',
  })
  @IsEnum(PublishingChannel, { message: '状态' })
  @IsOptional()
  @Expose()
  publishingChannel: PublishingChannel
}

export class UpdatePublishRecordTimeDto {
  @ApiProperty({ title: '数据ID' })
  @IsString({ message: '数据ID' })
  @Expose()
  id: string

  @ApiProperty({ title: '新的发布时间', required: false })
  @IsDate({ message: '新的发布时间必须是有效的日期，日期为UTC时间\'' })
  @Transform(({ value }) => {
    if (!value)
      return undefined
    return new Date(value)
  })
  @IsOptional()
  @Expose()
  publishTime: Date
}

export const createPublishRecordSchema = z.object({
  flowId: z.string().optional(),
  dataId: z.string(),
  type: z.nativeEnum(PublishType),
  status: z.nativeEnum(PublishStatus, { message: '状态' }),
  title: z.string().optional(),
  desc: z.string().optional(),
  userTaskId: z.string().optional().describe('用户任务ID'),
  taskMaterialId: z.string().optional().describe('素材ID'),
  accountId: z.string(),
  topics: z.array(z.string()),
  accountType: z.nativeEnum(AccountType),
  uid: z.string(),
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgUrlList: z.array(z.string()).optional(),
  publishTime: z.union([z.date(), z.string()]).transform((arg) => {
    return new Date(arg)
  }),
  imgList: z.array(z.string()).optional(),
  workLink: z.string().optional(),
  errorMsg: z.string().optional(),
  option: z.any(),
})
export class CreatePublishRecordDto extends createZodDto(createPublishRecordSchema) { }

export const PublishDayInfoListFiltersSchema = z.object({
  time: z.tuple([
    z.string().transform((arg) => {
      return new Date(arg)
    }),
    z.string().transform((arg) => {
      return new Date(arg)
    }),
  ]).optional(),
})
export class PublishDayInfoListFiltersDto extends createZodDto(PublishDayInfoListFiltersSchema) { }

export const listPostHistorySchema = z.object({
  uid: z.string(),
  accountType: z.nativeEnum(AccountType),
})
export class ListPostHistoryDto extends createZodDto(listPostHistorySchema) {}
