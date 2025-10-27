import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../../db/schema/user.schema';
import { PagerDto } from '../../common/dto/pager.dto';

export class QueryUserListDto extends PagerDto {
  @ApiProperty({ description: '用户名', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '状态', required: false, enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UpdateUserStatusDto {
  @ApiProperty({ description: '状态', enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus;
}
