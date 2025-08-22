import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsNumber, IsOptional, Min } from 'class-validator'

export class GetPointsRecordsDto {
  @ApiProperty({ description: '页码', default: 1 })
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码最小为1' })
  @IsOptional()
  @Expose()
  readonly page?: number = 1

  @ApiProperty({ description: '每页数量', default: 10 })
  @Type(() => Number)
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Min(1, { message: '每页数量最小为1' })
  @IsOptional()
  @Expose()
  readonly pageSize?: number = 10
}
