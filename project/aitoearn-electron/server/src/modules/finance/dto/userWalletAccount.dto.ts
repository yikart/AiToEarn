/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 12:11:19
 * @LastEditors: nevin
 * @Description:
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  UserWalletAccount,
  WalletAccountType,
} from 'src/db/schema/userWalletAccount.shema';

export class CreateUserWalletAccountDto implements Partial<UserWalletAccount> {
  @ApiProperty({ type: String })
  @IsString({ message: '账号号码必须是字符串' })
  @IsOptional()
  @Expose()
  account?: string;

  @ApiProperty({ type: String })
  @IsNotEmpty({ message: '姓名不能为空' })
  @IsString()
  @Expose()
  userName: string;

  @ApiProperty({ type: String })
  @IsNotEmpty({ message: '身份证不能为空' })
  @IsString()
  @Expose()
  cardNum: string;

  @ApiProperty({ type: String })
  @IsNotEmpty({ message: '手机号不能为空' })
  @IsString()
  @Expose()
  phone: string;

  @ApiProperty({ enum: WalletAccountType })
  @IsNotEmpty({ message: '钱包类型不能为空' })
  @IsEnum(WalletAccountType)
  @Expose()
  type: WalletAccountType;
}
