/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:16:37
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
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { PagerDto } from 'src/common/dto/pager.dto';
import { SignIn, SignInType } from 'src/db/schema/signIn.schema';

export class CreateSignInDto implements Partial<SignIn> {
  @ApiProperty({ enum: SignInType })
  @IsNotEmpty({ message: '类型不能为空' })
  @IsEnum(SignInType)
  @Expose()
  type: SignInType;
}

export class QuerySignInListDto extends PagerDto {
  @ApiProperty({ enum: SignInType })
  @IsNotEmpty({ message: '类型不能为空' })
  @IsEnum(SignInType)
  @Expose()
  readonly type: SignInType;

  @ApiProperty({ title: '创建时间区间', required: false })
  @IsArray({ message: '创建时间区间必须是一个数组' })
  @ArrayMinSize(2, { message: '创建时间区间必须包含两个日期' })
  @ArrayMaxSize(2, { message: '创建时间区间必须包含两个日期' })
  @IsDateString({}, { each: true })
  @IsOptional()
  @Expose()
  readonly time?: [Date, Date];
}
