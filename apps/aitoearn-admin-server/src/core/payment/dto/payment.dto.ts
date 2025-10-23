import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import {
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator'

export class CheckoutQueryDto {
  @ApiProperty({ title: 'keyword,搜索字段 可以搜索id和userId', required: false })
  @IsString({ message: 'keyword' })
  @IsOptional()
  @Expose()
  readonly keyword?: string
}

export class RefundBodyDto {
  @ApiProperty({ title: 'checkout表里面的charge ', required: true })
  @IsString({ message: 'checkout表里面的charge' })
  @IsOptional()
  @Expose()
  readonly charge: string
}

export class SubscriptionBodyDto {
  @ApiProperty({ title: '页面' })
  @IsInt({ message: '页面' })
  @IsOptional()
  @Expose()
  readonly page?: number

  @ApiProperty({ title: '每页个数' })
  @IsInt({ message: '每页个数' })
  @IsOptional()
  @Expose()
  readonly size?: number

  @ApiProperty({ title: 'search,搜索字段 可以搜索id和userId' })
  @IsString({ message: 'search' })
  @IsOptional()
  @Expose()
  readonly search?: string
}

export class UnSubscriptionBodyDto {
  @ApiProperty({ title: '订阅id', required: true })
  @IsString({ message: '订阅id' })
  @Expose()
  readonly id: string
}
