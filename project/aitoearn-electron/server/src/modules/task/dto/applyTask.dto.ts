/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-05-06 13:46:44
 * @LastEditors: nevin
 * @Description: 任务接受
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { AccountType } from 'src/db/schema/account.schema';

export class ApplyTaskDto {
  @ApiProperty({ description: '账号' })
  @IsString()
  account: string;

  @ApiProperty({ description: '用户ID' })
  @IsString()
  uid: string;

  @ApiProperty({ description: '平台类型', enum: AccountType })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({ description: '任务素材ID', required: false })
  @IsString()
  taskMaterialId?: string;
}
