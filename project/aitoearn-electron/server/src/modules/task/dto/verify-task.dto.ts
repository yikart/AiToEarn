import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class RejectedTaskDto {
  @ApiProperty({ description: '验证备注', required: false })
  @IsString()
  @Expose()
  verificationNote: string;
}
