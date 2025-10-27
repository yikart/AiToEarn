/*
 * @Author: nevin
 * @Date: 2025-01-20 16:36:41
 * @LastEditTime: 2025-02-22 18:09:51
 * @LastEditors: nevin
 * @Description:
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  Allow,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PagerDto<T = any> {
  @ApiProperty({ minimum: 1, default: 1 })
  @Min(1)
  @IsInt()
  @Expose()
  @IsOptional({ always: true })
  @Transform(({ value: val }) => (val ? Number.parseInt(val) : 1), {
    toClassOnly: true,
  })
  page: number = 1;

  @ApiProperty({ minimum: 1, maximum: 100, default: 20 })
  @Min(1)
  @Max(100)
  @IsInt()
  @IsOptional({ always: true })
  @Expose()
  @Transform(({ value: val }) => (val ? Number.parseInt(val) : 20), {
    toClassOnly: true,
  })
  pageSize: number = 20;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  field?: string;

  @ApiProperty({ enum: Order, required: false })
  @IsEnum(Order)
  @IsOptional()
  @Transform(({ value }) => (value === 'asc' ? Order.ASC : Order.DESC))
  order?: Order;

  @Allow()
  _t?: number;
}
