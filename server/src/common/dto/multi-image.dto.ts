import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MultiImage {
  @ApiProperty({ description: '图片地址' })
  @IsString()
  url: string;

  @ApiProperty({ description: '图片名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '图片大小', required: false })
  @IsNumber()
  @IsOptional()
  size?: number;
}
