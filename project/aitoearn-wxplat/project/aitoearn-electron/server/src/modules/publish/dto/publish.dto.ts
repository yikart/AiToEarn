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
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AccountType } from 'src/db/schema/account.schema';
import { PubType, PubStatus } from 'src/db/schema/pubRecord.schema';

export class CreatePublishDto {
  @ApiProperty({
    title: '类型',
    required: true,
    enum: PubType,
    description: '类型',
  })
  @IsEnum(PubType, { message: '类型' })
  @Expose()
  readonly type: PubType;

  @ApiProperty({ title: '标题', required: true })
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string;

  @ApiProperty({ title: '描述', required: true })
  @IsString({ message: '描述' })
  @Expose()
  readonly desc: string;

  @ApiProperty({ title: '账户ID', required: true })
  @IsNumber({ allowNaN: false }, { message: '账户ID' })
  @Expose()
  readonly accountId: number;

  @ApiProperty({ title: '视频路径', required: false })
  @IsString({ message: '视频路径' })
  @IsOptional()
  @Expose()
  readonly videoPath?: string;

  @ApiProperty({ title: '定时发布日期', required: false })
  @IsDate({ message: '定时发布日期必须是有效的日期' })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => new Date(value))
  readonly timingTime?: Date;

  @ApiProperty({ title: '封面路径，展示给前台用', required: false })
  @IsString({ message: '封面路径，展示给前台用' })
  @IsOptional()
  @Expose()
  readonly coverPath?: string;

  @ApiProperty({ title: '通用封面路径', required: false })
  @IsString({ message: '通用封面路径' })
  @IsOptional()
  @Expose()
  readonly commonCoverPath?: string;

  @ApiProperty({ title: '发布日期', required: false })
  @IsDate({ message: '发布日期必须是有效的日期' })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => new Date(value))
  readonly publishTime?: Date;

  @ApiProperty({
    title: '发布状态',
    required: false,
    enum: PubStatus,
    description: '发布状态',
  })
  @IsEnum(PubStatus, { message: '发布状态' })
  @IsOptional()
  @Expose()
  readonly status?: PubStatus;
}

export class PubRecordListDto {
  @ApiProperty({
    title: '账户类型',
    required: false,
    enum: AccountType,
    description: '账户类型',
  })
  @IsEnum(AccountType, { message: '账户类型' })
  @IsOptional()
  @Expose()
  readonly type?: AccountType;

  @ApiProperty({ title: '创建时间区间', required: false })
  @IsArray({ message: '创建时间区间必须是一个数组' })
  @ArrayMinSize(2, { message: '创建时间区间必须包含两个日期' })
  @ArrayMaxSize(2, { message: '创建时间区间必须包含两个日期' })
  @IsDate({ each: true, message: '创建时间区间中的每个元素必须是有效的日期' })
  @IsOptional()
  @Expose()
  @Transform(({ value }) => value ? value.map((v: string) => new Date(v)) : undefined)
  readonly time?: [Date, Date];
}
