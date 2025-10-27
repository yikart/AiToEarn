import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '账号' })
  @IsString()
  @IsNotEmpty()
  account: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class CreateManagerDto {
  @ApiProperty({ description: '账号' })
  @IsString()
  @IsNotEmpty()
  account: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: '姓名' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class UpdateManagerDto {
  @ApiProperty({ description: '姓名', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: '头像', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ description: '密码', required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ description: '盐', required: false })
  @IsString()
  @IsOptional()
  salt?: string;
}
