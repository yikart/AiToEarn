import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsInt, IsOptional } from 'class-validator'

export class TableDto {
  @ApiProperty({ title: '页码', description: '页码' })
  @Type(() => Number)
  @IsInt({ message: '页码必须是数值' })
  @IsOptional()
  @Expose()
  readonly pageNo?: number = 1

  @Type(() => Number)
  @ApiProperty({ title: '页数', description: '页数' })
  @IsInt({ message: '每页个数必须是数值' })
  @Expose()
  @IsOptional()
  readonly pageSize?: number = 10

  @Type(() => Number)
  @IsInt({ message: '分页标识必须是数值' })
  @IsOptional()
  readonly paging?: number = 1
}
