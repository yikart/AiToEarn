/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:16:37
 * @LastEditors: nevin
 * @Description:
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { VideoUTypes } from '../comment';

export class AccessBackDto {
  @Expose()
  code: string;

  @Expose()
  state: string;
}

export class VideoInitDto {
  @ApiProperty({ title: '文件名称(带格式)', required: true })
  @IsString({ message: '文件名称' })
  @Expose()
  readonly fileName: string;

  @ApiProperty({ enum: VideoUTypes })
  @IsNotEmpty({ message: '文件类型不能为空' })
  @IsEnum(VideoUTypes)
  @Type(() => Number)
  @Expose()
  readonly utype: VideoUTypes;
}

export class ArchiveAddByUtokenQueryDto {
  @ApiProperty({ title: '用户token', required: true })
  @IsString({ message: '用户token' })
  @Expose()
  readonly accessToken: string;

  @ApiProperty({ title: '上传token', required: true })
  @IsString({ message: '上传token' })
  @Expose()
  readonly uploadToken: string;
}

export class ArchiveAddByUtokenBodyDto {
  @ApiProperty({ title: '标题', required: true })
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string;

  @ApiProperty({ title: '封面url', required: false })
  @IsString({ message: '封面url' })
  @IsOptional()
  @Expose()
  readonly cover?: string;

  @ApiProperty({ title: '分区ID，由获取分区信息接口得到', required: true })
  @IsNumber({ allowNaN: false }, { message: '分区ID，由获取分区信息接口得到' })
  @Expose()
  readonly tid: number;

  @ApiProperty({
    title: '是否允许转载 0-允许，1-不允许。默认0',
    required: true,
  })
  @IsNumber(
    { allowNaN: false },
    { message: '是否允许转载 0-允许，1-不允许。默认0' },
  )
  @IsOptional()
  @Expose()
  readonly noReprint?: 0 | 1;

  @ApiProperty({ title: '描述', required: false })
  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly desc?: string;

  @ApiProperty({ title: '标签', required: false })
  @IsArray({ message: '标签必须是字符串数组' })
  @IsString({ each: true, message: '描述' })
  @Expose()
  readonly tag: string[];

  @ApiProperty({
    title: '1-原创，2-转载(转载时source必填)',
    required: true,
  })
  @IsNumber(
    { allowNaN: false },
    { message: '1-原创，2-转载(转载时source必填)' },
  )
  @Expose()
  readonly copyright: 1 | 2;

  @ApiProperty({
    title: '如果copyright为转载，则此字段表示转载来源',
    required: false,
  })
  @IsString({ message: '如果copyright为转载，则此字段表示转载来源' })
  @IsOptional()
  @Expose()
  readonly source?: string;
}

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google客户端ID' })
  @IsString()
  @Expose()
  clientId: string;

  @ApiProperty({ description: 'Google认证凭证' })
  @IsString()
  @Expose()
  credential: string;
}
