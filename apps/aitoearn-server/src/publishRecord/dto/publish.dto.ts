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

/**
 * 创建发布记录
 */
export const publishRecordIdSchema = z.object({
  id: z.string({ message: 'id' }),
})
export class PublishRecordIdDto extends createZodDto(publishRecordIdSchema) {}

export enum BilibiliNoReprint {
  No = 1,
  Yes = 0,
}
export enum Copyright {
  Original = 1, // 原创
  Reprint = 2,
}

/**
 * 创建发布记录
 */
export const CreatePublishRecordSchema = z.object({
  flowId: z.string({ message: '流水ID' }).optional(),
  dataId: z.string({ message: '数据ID' }),
  userId: z.string({ message: '用户ID' }),
  uid: z.string({ message: '频道账户ID' }),
  accountId: z.string({ message: '账户ID' }),
  accountType: z.enum(AccountType, { message: '平台类型' }),
  type: z.enum(PublishType, { message: '类型' }),
  status: z.enum(PublishStatus, { message: '状态' }),
  title: z.string().optional(),
  desc: z.string().optional(),
  userTaskId: z.string({ message: '用户任务ID' }).optional(), // 用户任务ID
  taskId: z.string({ message: '任务ID' }).optional(), // 任务ID
  taskMaterialId: z.string({ message: '任务素材ID' }).optional(), // 任务素材ID
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgUrlList: z.array(z.string()).optional(),
  publishTime: z.union([z.date(), z.string()]).transform((arg) => {
    return new Date(arg)
  }),
  topics: z.array(z.string()),
  workLink: z.string({ message: '作品链接' }).optional(),
  option: z.object().optional(),
})
export class CreatePublishRecordDto extends createZodDto(CreatePublishRecordSchema) {}

export class PublishRecordListFilterDto {
  @IsString({ message: '用户ID' })
  @Expose()
  readonly userId: string

  @IsString({ message: '账户ID' })
  @IsOptional()
  @Expose()
  readonly accountId?: string

  @IsString({ message: '第三方平台id' })
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

  @ApiProperty({ title: '创建时间区间', required: false })
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

export const PublishDayInfoListFiltersSchema = z.object({
  userId: z.string(),
  time: z.tuple([
    z.union([z.date(), z.string()]).transform((arg) => {
      return new Date(arg)
    }),
    z.union([z.date(), z.string()]).transform((arg) => {
      return new Date(arg)
    }),
  ]).optional(),
})
export class PublishDayInfoListFiltersDto extends createZodDto(PublishDayInfoListFiltersSchema) {}

export const PublishDayInfoListSchema = z.object({
  filters: PublishDayInfoListFiltersSchema,
  page: z.object({
    pageNo: z.number().min(1, { message: '页码不能小于1' }),
    pageSize: z.number().min(1, { message: '页大小不能小于1' }),
  }),
})
export class PublishDayInfoListDto extends createZodDto(PublishDayInfoListSchema) {}

export const GetPublishRecordDetailSchema = z.object({
  flowId: z.string({ message: 'flowId is required' }),
  userId: z.string({ message: 'userId is required' }),
})

export class GetPublishRecordDetailDto extends createZodDto(GetPublishRecordDetailSchema) {}

export const donePublishRecordSchema = z.object({
  filter: z.object({
    dataId: z.string({ message: '数据ID' }),
    uid: z.string({ message: '渠道ID' }),
  }),
  data: z.object({
    workLink: z.string({ message: '作品链接' }).optional(),
    dataOption: z.any().optional(),
  }),
})
export class DonePublishRecordDto extends createZodDto(donePublishRecordSchema) {}
