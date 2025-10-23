import { ApiProperty } from '@nestjs/swagger'
import { FilterSet } from '@yikart/task-db'
import { Expose } from 'class-transformer'
import { IsOptional, IsString } from 'class-validator'

export class AccountPortraitListFilterDto {
  @ApiProperty({ required: false, description: '关键词搜索' })
  @IsOptional()
  @IsString()
  @Expose()
  keyword?: string

  @ApiProperty({ required: false, description: '相关任务ID' })
  @IsOptional()
  @IsString()
  @Expose()
  taskId?: string

  @ApiProperty({ required: false, description: '过滤规则' })
  @IsOptional()
  @Expose()
  rule?: FilterSet
}

export class UserPortraitListFilterDto {
  @ApiProperty({ required: false, description: '关键词搜索' })
  @IsOptional()
  @IsString()
  @Expose()
  keyword?: string

  @ApiProperty({ required: false, description: '过滤规则' })
  @IsOptional()
  @Expose()
  time?: string[]
}
