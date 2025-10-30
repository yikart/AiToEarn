import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Expose } from 'class-transformer';
import { AccountStatus, AccountType } from '../../../db/schema/account.schema';

export class CreateAccountDto {
  @ApiProperty({ description: '平台类型', enum: AccountType })
  @IsEnum(AccountType)
  @Expose()
  type: AccountType;

  @ApiProperty({ description: '登录Cookie' })
  @IsString()
  @Expose()
  loginCookie: string;

  @ApiProperty({ description: '登录时间' })
  @IsOptional()
  @IsDate()
  @Expose()
  loginTime?: Date;

  @ApiProperty({ description: '平台用户ID' })
  @IsString()
  @Expose()
  uid: string;

  @ApiProperty({ description: '账号' })
  @IsString()
  @Expose()
  account: string;

  @ApiProperty({ description: '头像' })
  @IsString()
  @Expose()
  avatar: string;

  @ApiProperty({ description: '昵称' })
  @IsString()
  @Expose()
  nickname: string;

  @ApiProperty({ description: '粉丝数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  fansCount?: number;

  @ApiProperty({ description: '阅读数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  readCount?: number;

  @ApiProperty({ description: '点赞数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  likeCount?: number;

  @ApiProperty({ description: '收藏数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  collectCount?: number;

  @ApiProperty({ description: '转发数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  forwardCount?: number;

  @ApiProperty({ description: '评论数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  commentCount?: number;

  @ApiProperty({ description: '最后统计时间' })
  @IsDate()
  @IsOptional()
  @Expose()
  lastStatsTime?: Date;

  @ApiProperty({ description: '作品数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  workCount?: number;

  @ApiProperty({ description: '收入' })
  @IsNumber()
  @IsOptional()
  @Expose()
  income?: number;

  @ApiProperty({ description: '账户组ID' })
  @IsNumber()
  @IsOptional()
  @Expose()
  groupId?: number;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @ApiProperty({ description: '更新ID' })
  @IsNumber()
  @Expose()
  id: number;
}

export class AccountIdDto {
  @ApiProperty({ description: '账号ID' })
  @IsNumber()
  @Expose()
  id: number;
}

export class UpdateAccountStatusDto extends AccountIdDto {
  @ApiProperty({ description: '状态' })
  @IsEnum(AccountStatus, {
    message: `status must be one of these values: ${Object.values(
      AccountStatus,
    ).join(', ')}`,
  })
  @Expose()
  status: AccountStatus;
}

export class AccountListByIdsDto {
  @ApiProperty({ description: '账号ID数组', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  ids: number[];
}

export class AccountStatisticsDto {
  @ApiProperty({ description: '账户类型', enum: AccountType, required: false })
  @IsEnum(AccountType)
  @IsOptional()
  @Expose()
  type?: AccountType;
}

export class UpdateAccountStatisticsDto {
  @ApiProperty({ description: '账号ID' })
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty({ description: '作品数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  workCount?: number;

  @ApiProperty({ description: '粉丝数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  fansCount?: number;

  @ApiProperty({ description: '阅读数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  readCount?: number;

  @ApiProperty({ description: '点赞数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  likeCount?: number;

  @ApiProperty({ description: '收藏数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  collectCount?: number;

  @ApiProperty({ description: '评论数' })
  @IsNumber()
  @IsOptional()
  @Expose()
  commentCount?: number;

  @ApiProperty({ description: '收入' })
  @IsNumber()
  @IsOptional()
  @Expose()
  income?: number;
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

export class DeleteAccountsDto {
  @ApiProperty({ description: '要删除的ID' })
  @IsArray()
  @IsNumber({}, { each: true })
  @Expose()
  ids: string[];
}
