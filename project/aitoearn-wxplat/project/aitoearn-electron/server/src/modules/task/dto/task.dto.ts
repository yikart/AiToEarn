/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-03-03 19:28:44
 * @LastEditors: nevin
 * @Description: 更新
 */
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsEnum, IsString } from 'class-validator';
import { TaskStatus } from 'src/db/schema/task.schema';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class ActionTaskFileDto {
  @ApiProperty({ description: '名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '文件URL' })
  @IsString()
  url: string;
}

export class UpTaskStatusDto {
  @IsString()
  id: string;

  @IsEnum(TaskStatus)
  status: TaskStatus;
}
