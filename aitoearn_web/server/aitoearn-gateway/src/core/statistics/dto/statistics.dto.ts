import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'

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
