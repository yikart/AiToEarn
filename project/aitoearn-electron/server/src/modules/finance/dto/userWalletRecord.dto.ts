/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-03-24 21:52:23
 * @LastEditors: nevin
 * @Description:
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PagerDto } from 'src/common/dto/pager.dto';
import {
  UserWalletRecordStatus,
  UserWalletRecordType,
} from 'src/db/schema/userWalletRecord.shema';

export class GetUserWalletRecordListDto extends PagerDto {
  @ApiProperty({ title: '创建时间区间', required: false })
  @IsArray({ message: '创建时间区间必须是一个数组' })
  @ArrayMinSize(2, { message: '创建时间区间必须包含两个日期' })
  @ArrayMaxSize(2, { message: '创建时间区间必须包含两个日期' })
  // @IsDate({ each: true, message: '创建时间区间中的每个元素必须是有效的日期' })
  @IsDateString({}, { each: true })
  @IsOptional()
  @Expose()
  readonly time?: [Date, Date];

  @ApiProperty({ enum: UserWalletRecordType })
  @IsEnum(UserWalletRecordType)
  @IsOptional()
  @Expose()
  type?: UserWalletRecordType;
}

export class GetUserWalletRecordListByAdminDto extends PagerDto {
  // 起始时间
  @ApiProperty({ type: [String] })
  @Expose()
  time?: [string, string];

  @ApiProperty({ enum: UserWalletRecordType })
  @Expose()
  type?: UserWalletRecordType;

  @ApiProperty({ enum: UserWalletRecordStatus })
  @Expose()
  status?: UserWalletRecordStatus;

  @ApiProperty({ type: String })
  @Expose()
  userId?: string;
}

export class UpUserWalletRecordPul {
  @IsString({
    message: '说明',
  })
  @IsOptional()
  @Expose()
  des?: string;

  @IsString({
    message: '反馈截图',
  })
  @IsOptional()
  @Expose()
  imgUrl?: string; // 反馈截图
}

export class CreateUserWalletRecordDto {
  @ApiProperty({ type: String, description: '钱包账户id', required: true })
  @IsString({
    message: '钱包账户id必须为字符串',
  })
  @Expose()
  walletAccountId: string;

  @ApiProperty({ type: Number, description: '金额', required: true })
  @IsNumber(
    {
      allowNaN: false,
    },
    { message: '金额必须为数字' },
  )
  @Expose()
  balance: number;

  @ApiProperty({ enum: UserWalletRecordStatus })
  status?: UserWalletRecordStatus;
}
