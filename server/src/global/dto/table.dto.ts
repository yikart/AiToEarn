/*
 * @Author: nevin
 * @Date: 2022-03-17 18:14:52
 * @LastEditors: nevin
 * @LastEditTime: 2024-10-10 15:45:59
 * @Description: 表单数据
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class TableDto {
  @Type(() => Number)
  @IsInt({ message: '页码必须是数值' })
  @IsOptional()
  @Expose()
  readonly pageNo?: number = 1;

  @Type(() => Number)
  @IsInt({ message: '每页个数必须是数值' })
  @Expose()
  @IsOptional()
  readonly pageSize?: number = 10;

  @Type(() => Number)
  @IsInt({ message: '分页标识必须是数值' })
  @IsOptional()
  readonly paging?: number = 1;
}

export class TableResDto {
  @ApiProperty({ title: '页码', description: '页码' })
  readonly pageNo: number = 1;

  @ApiProperty({ title: '页数', description: '页数' })
  readonly pageSize: number = 10;

  @ApiProperty({ title: '总数', description: '总数' })
  readonly count: number = 0;
}
