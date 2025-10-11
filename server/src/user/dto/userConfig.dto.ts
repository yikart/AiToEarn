/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber, IsEnum } from 'class-validator';
import { EarnInfoStatus } from 'src/db/schema/user.schema';

export class SetUserEarnDto {
  @ApiProperty({ required: true })
  @IsEnum(EarnInfoStatus, { message: '状态' })
  @Type(() => Number)
  @Expose()
  readonly status: EarnInfoStatus;

  @ApiProperty({ title: '循环时间', required: true })
  @IsNumber({}, { message: '循环时间' })
  @Type(() => Number)
  @Expose()
  readonly cycleInterval: number;
}
