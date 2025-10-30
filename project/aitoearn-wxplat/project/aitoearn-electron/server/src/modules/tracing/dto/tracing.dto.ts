/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-05-06 14:10:37
 * @LastEditors: nevin
 * @Description: 跟踪
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TracingType } from 'src/db/schema/tracing.schema';

export class CreateTracingDto {
  @ApiProperty({ title: '类型', required: true })
  @IsEnum(TracingType, { message: '类型' })
  @Expose()
  readonly type: TracingType;

  @ApiProperty({ title: 'Tag', required: true })
  @IsString({ message: 'Tag' })
  @Expose()
  readonly tag: string;

  @ApiProperty({ title: '平台账号ID', required: false })
  @IsNumber({ allowNaN: false }, { message: '平台账号ID' })
  @IsOptional()
  @Expose()
  readonly accountId?: number;

  @ApiProperty({ title: '描述', required: false })
  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly desc?: string;

  @ApiProperty({ title: '关联数据ID', required: false })
  @IsString({ message: '关联数据ID' })
  @IsOptional()
  @Expose()
  readonly dataId?: string;

  // 任意类型的数据
  @ApiProperty({ title: '数据', required: false })
  @IsOptional()
  @Expose()
  readonly data?: any;
}

export class TracingTimeDto {
  @ApiProperty({ title: '创建时间区间', required: false })
  @IsArray({ message: '创建时间区间必须是一个数组' })
  @ArrayMinSize(2, { message: '创建时间区间必须包含两个日期' })
  @ArrayMaxSize(2, { message: '创建时间区间必须包含两个日期' })
  @IsDateString({}, { each: true })
  @IsOptional()
  @Expose()
  readonly time?: [Date, Date];
}
