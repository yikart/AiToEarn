/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-04-14 16:36:06
 * @LastEditors: nevin
 * @Description:
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class CreateGzhMenuDto {
  @ApiProperty({ title: '菜单JSON字符', required: true })
  @IsString({ message: '菜单JSON字符' })
  @Expose()
  readonly menuStr: string;
}
