/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: publish
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateWorkDataDto } from './workData.dto';

export class PubRecordIdDto {
  @ApiProperty({ title: '发布记录ID', required: true })
  @IsNumber({ allowNaN: false }, { message: '发布记录ID' })
  @Expose()
  readonly pubRecordId: number;
}

export class VideoPulIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsNumber({ allowNaN: false }, { message: 'ID' })
  @Expose()
  readonly id: number;
}

export class VideoPulListDto {
  @ApiProperty({ title: '发布记录ID', required: false })
  @IsNumber({ allowNaN: false }, { message: '发布记录ID' })
  @IsOptional()
  @Expose()
  readonly pubRecordId?: number;

  @ApiProperty({ title: '创建时间区间', required: false })
  @IsArray({ message: '创建时间区间必须是一个数组' })
  @ArrayMinSize(2, { message: '创建时间区间必须包含两个日期' })
  @ArrayMaxSize(2, { message: '创建时间区间必须包含两个日期' })
  @IsDate({ each: true, message: '创建时间区间中的每个元素必须是有效的日期' })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => value.map((v: string) => new Date(v)))
  readonly time?: [Date, Date];

  @ApiProperty({ title: '标题', required: false })
  @IsString({ message: '标题必须是一个字符串' })
  @IsOptional()
  @Expose()
  readonly title?: string;
}

export class CreateVideoPulDto extends CreateWorkDataDto {
  @ApiProperty({ title: '视频路径', required: false })
  @IsString({ message: '视频路径必须是一个字符串' })
  @IsOptional()
  @Expose()
  readonly videoPath: string;
}
