/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { User } from '../../db/schema/user.schema';
import { GenderEnum } from '../../global/enum/all.enum';

export class WxLoginDto {
  @ApiProperty({ title: '微信登录的code', required: true })
  @IsString({ message: 'code' })
  @Expose()
  code: string;
}

export class PhoneDto {
  @ApiProperty({ title: '手机号', required: true })
  @IsPhoneNumber('CN', { message: '手机号' })
  @Expose()
  readonly phone: string;
}

export class LoginByPhoneDto {
  @ApiProperty({ title: '手机号', required: true })
  @IsPhoneNumber('CN', { message: '手机号' })
  @Expose()
  readonly phone: string;

  @ApiProperty({ required: true })
  @IsString({ message: '短信验证码' })
  @Expose()
  readonly code: string;
}

export class GetRegisterCodeDto {
  @ApiProperty({ required: true })
  @IsPhoneNumber('CN', { message: '手机号' })
  @Expose()
  readonly phone: string;
}

// 手机号注册
export class PhoneRegisterDto {
  @ApiProperty({ required: true, title: '短信验证码' })
  @IsString({ message: '短信验证码' })
  @Expose()
  readonly code: string;

  @ApiProperty({ required: true, title: '手机号' })
  @IsPhoneNumber('CN', { message: '手机号' })
  @Expose()
  readonly phone: string;

  @ApiProperty({ required: true, title: '密码' })
  @IsString({ message: '密码' })
  @Expose()
  readonly password: string;
}

// 手机号验证码登录
export class PhoneLoginByCodeDto {
  @ApiProperty({ required: true })
  @IsPhoneNumber('CN', { message: '手机号' })
  @Expose()
  readonly phone: string;

  @ApiProperty({ required: true })
  @IsString({ message: '短信验证码' })
  @Expose()
  readonly code: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Expose()
  readonly inviteCode?: string;
}

export class PhoneLoginByAuthDto {
  @ApiProperty({ required: true })
  @IsString({ message: '授权码' })
  @Expose()
  readonly accessToken: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Expose()
  readonly inviteCode?: string;
}

export class LoginByPasswordDto {
  @ApiProperty({ title: '手机号', required: true })
  @IsPhoneNumber('CN', { message: '手机号' })
  @Expose()
  readonly phone: string;

  @ApiProperty({ required: true })
  @IsString({ message: '密码' })
  @Expose()
  readonly password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ required: true })
  @IsString({ message: '密码' })
  @Expose()
  readonly password: string;
}

export class UpdateUserInfoDto {
  @ApiProperty({ title: '昵称' })
  @IsString({ message: '昵称' })
  @IsOptional()
  @Expose()
  readonly name?: string;

  @ApiProperty({ title: '头像' })
  @IsString({ message: '头像' })
  @IsOptional()
  @Expose()
  avatar?: string;

  @ApiProperty({ required: false, title: '性别' })
  @IsEnum(GenderEnum, { message: '性别' })
  @IsOptional()
  @Expose()
  readonly gender?: GenderEnum;

  @ApiProperty({ title: '简介' })
  @IsString({ message: '简介' })
  @IsOptional()
  @Expose()
  readonly desc?: string;
}

export class UserResDto implements Partial<User> {
  @ApiProperty({ title: '用户ID', required: true })
  id: string;

  @ApiProperty({ title: '用户名', required: true })
  name: string;

  @ApiProperty({ title: '手机号', required: true })
  phone: string;

  @ApiProperty({ title: '性别', enum: GenderEnum, required: false })
  gender?: GenderEnum;

  @ApiProperty({ title: '头像图片链接', required: false })
  avatar?: string;

  @ApiProperty({ title: '简介', required: false })
  desc?: string;
}

export class PhoneRegisterResDto {
  @ApiProperty({ title: '用户信息', required: true })
  userInfo: UserResDto;

  @ApiProperty({ title: '登录的Ttoken信息', required: true })
  token: string = 'Beare sss';
}

export class SetWxInfoDto {
  @ApiProperty({ required: true })
  @IsString({ message: '微信授权码' })
  @Expose()
  readonly code: string;
}

// 手机号验证码登录
export class PhoneLoginByGzhDto {
  @ApiProperty({ required: true })
  @IsPhoneNumber('CN', { message: '手机号' })
  @Expose()
  readonly phone: string;

  @ApiProperty({ required: true })
  @IsString({ message: '短信验证码' })
  @Expose()
  readonly code: string;

  @ApiProperty({ required: true })
  @IsString({ message: '二维码票据' })
  @Expose()
  readonly openId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Expose()
  readonly inviteCode?: string;
}
