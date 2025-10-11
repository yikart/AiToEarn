import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PagerDto } from '../../../common/dto/pager.dto';
import { UserTaskStatus } from '../../../db/schema/user-task.schema';

export class QueryVerificationDto extends PagerDto {
  @ApiProperty({
    description: '任务状态',
    enum: UserTaskStatus,
    required: false,
  })
  @IsEnum(UserTaskStatus)
  @IsOptional()
  status?: UserTaskStatus;
}
