/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-02-27 20:22:49
 * @LastEditors: nevin
 * @Description:
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, TaskType } from '../../../db/schema/task.schema';
import { PagerDto } from '../../../common/dto/pager.dto';
import { UserTaskStatus } from 'src/db/schema/user-task.schema';

export class QueryTaskDto extends PagerDto {
  @ApiProperty({ description: '任务类型', enum: TaskType, required: false })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiProperty({ description: '任务状态', enum: TaskStatus, required: false })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({ description: '搜索关键词（标题）', required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ description: '带货等级', required: false })
  @IsString()
  @IsOptional()
  productLevel?: string;

  @ApiProperty({ description: '是否需要挂购物车', required: false })
  @Type(() => Boolean)
  @IsOptional()
  requiresShoppingCart?: boolean;
}

export class QueryMineTaskDto extends PagerDto {
  @ApiProperty({ description: '任务类型', enum: TaskType, required: false })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiProperty({ description: '搜索关键词（标题）', required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ description: '状态', required: false })
  @IsEnum(UserTaskStatus)
  @IsOptional()
  status?: UserTaskStatus;
}
