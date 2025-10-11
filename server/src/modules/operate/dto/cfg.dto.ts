/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-03-03 19:00:31
 * @LastEditors: nevin
 * @Description:
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsObject, IsString } from 'class-validator';

export class CreateCfgDto {
  @ApiProperty({ required: true })
  @IsString({ message: 'key' })
  @Expose()
  readonly key: string;

  @ApiProperty({ required: true })
  @IsString({ message: '标题必须填写' })
  @Expose()
  readonly title: string;

  @ApiProperty({ required: true })
  @IsObject({ message: '内容' })
  @Expose()
  readonly content: any;
}

export class UpdateCfgDto {
  @ApiProperty({ required: true })
  @IsString({ message: '内容' })
  @Expose()
  readonly content: string;
}

export class CfgIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsString({ message: 'ID' })
  @Expose()
  id: string;
}

export class CfgKeyDto {
  @ApiProperty({ title: 'key', required: true })
  @IsString({ message: 'key' })
  @Expose()
  key: string;
}
