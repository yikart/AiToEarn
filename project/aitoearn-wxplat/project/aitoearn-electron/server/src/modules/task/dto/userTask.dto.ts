/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-02-27 20:22:49
 * @LastEditors: nevin
 * @Description:
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../../../db/schema/task.schema';
import { PagerDto } from '../../../common/dto/pager.dto';

export class AdminQueryUserTaskDto extends PagerDto {
  @ApiProperty({ description: '任务状态', enum: TaskStatus, required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({ description: '搜索关键词（标题）', required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ type: [String] })
  time?: [string, string];
}
