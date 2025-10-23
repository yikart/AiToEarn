import { ApiProperty } from '@nestjs/swagger'
import { AccountType } from '@yikart/statistics-db'
import { Expose, Type } from 'class-transformer'
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator'

/**
 * 获取日期 DTO
 */
export class getPeriodDateDto {
  @ApiProperty({
    description: '开始日期',
    required: true,
  })
  @IsString({
    message: '开始日期',
  })
  @Expose()
  readonly startDate: string

  @ApiProperty({
    description: '结束日期',
    required: true,
  })
  @IsString({
    message: '结束日期',
  })
  @Expose()
  readonly endDate: string
}

export class PlatformUidQueryDto {
  @ApiProperty({ description: '平台', example: 'bilibili' })
  @IsString()
  @Expose()
  readonly platform: string

  @ApiProperty({ description: 'uid', example: '123456' })
  @IsString()
  @Expose()
  readonly uid: string
}

export class BatchChannelLatestQueryDto {
  @ApiProperty({
    description: '查询数组',
    type: [PlatformUidQueryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformUidQueryDto)
  @Expose()
  readonly queries: PlatformUidQueryDto[]
}
export class GetChannelDataPeriodByUidsDto {
  @ApiProperty({
    description: '查询数组',
    type: [PlatformUidQueryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformUidQueryDto)
  @Expose()
  readonly queries: PlatformUidQueryDto[]

  @IsString({ message: '开始日期' })
  @IsOptional()
  @Expose()
  readonly startDate?: string

  @IsString({ message: '结束日期' })
  @IsOptional()
  @Expose()
  readonly endDate?: string
}

export class TaskPostsDto {
  @ApiProperty({ description: '任务ID' })
  @IsString()
  @Expose()
  readonly taskId: string
}

export class TaskPostPeriodDto {
  @ApiProperty({ description: '平台', example: 'bilibili' })
  @IsString()
  @Expose()
  readonly platform: AccountType

  @ApiProperty({ description: '作品ID' })
  @IsString()
  @Expose()
  readonly postId: string
}

export class SearchTopicDto {
  @IsString({ message: '话题' })
  @Expose()
  readonly topic: string
}
