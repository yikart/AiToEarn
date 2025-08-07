import { ApiProperty } from '@nestjs/swagger'
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
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import {
  PublishStatus,
  PublishType,
} from '@/libs/database/schema/publishTask.schema'
import { AccountType } from '@/transports/account/common'

export class PublishRecordIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string
}

export const McpPromptPublishSchema = z.object({
  id: z.string({ required_error: '任务ID' }),
  userId: z.string({ required_error: 'userId不能为空' }),
})

export const UpPublishTaskTimeSchema = z.object({
  id: z.string({ required_error: '任务ID' }),

  /**
   * 发布日期
   */
  publishTime: z
    .date({ required_error: '发布日期不能为空' })
    .default(() => new Date()),
  userId: z.string({ required_error: 'userId不能为空' }),
})
export class UpPublishTaskTimeDto extends createZodDto(
  UpPublishTaskTimeSchema,
) {}

export const DeletePublishTaskSchema = z.object({
  id: z.string({ required_error: '任务ID' }),
  userId: z.string({ required_error: 'userId不能为空' }),
})
export class DeletePublishTaskDto extends createZodDto(
  DeletePublishTaskSchema,
) {}

export enum BilibiliNoReprint {
  No = 1,
  Yes = 0,
}
export enum Copyright {
  Original = 1, // 原创
  Reprint = 2,
}

export const BiliBiliPublishOptionSchema = z.object({
  tid: z.number().int().positive(),
  no_reprint: z.nativeEnum(BilibiliNoReprint).optional(),
  copyright: z.nativeEnum(Copyright),
  source: z.string().optional(),
})

export const CreatePublishSchema = z.object({
  flowId: z.string({ required_error: '流水ID' }).optional(),
  accountId: z.string({ required_error: '账户ID' }),
  accountType: z.nativeEnum(AccountType, { required_error: '平台类型' }),
  type: z.nativeEnum(PublishType, { required_error: '类型' }),
  title: z.string().optional(),
  desc: z.string().optional(),
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgList: z.array(z.string()).optional(),
  publishTime: z
    .date()
    .default(() => new Date()),
  topics: z.array(z.string()),
  option: z.object({
    bilibili: BiliBiliPublishOptionSchema.optional(),
  }).optional(),
})
export class CreatePublishDto extends createZodDto(CreatePublishSchema) {}

export const CreatePublishRecordSchema = z.object({
  flowId: z.string({ required_error: '流水ID' }).optional(),
  dataId: z.string({ required_error: '账户ID' }),
  accountId: z.string({ required_error: '账户ID' }),
  accountType: z.nativeEnum(AccountType, { required_error: '平台类型' }),
  type: z.nativeEnum(PublishType, { required_error: '类型' }),
  title: z.string().optional(),
  desc: z.string().optional(),
  videoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  imgList: z.array(z.string()).optional(),
  publishTime: z
    .date()
    .default(() => new Date()),
  topics: z.array(z.string()),
  option: z.object({
    bilibili: BiliBiliPublishOptionSchema.optional(),
  }).optional(),
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

// 立即发布 dto
export const NowPubTaskSchema = z.object({
  id: z.string({ required_error: '任务ID' }),
})
export class NowPubTaskDto extends createZodDto(NowPubTaskSchema) {}
