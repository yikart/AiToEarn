/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-05-06 13:46:44
 * @LastEditors: nevin
 * @Description: 任务接受
 */
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskType } from 'src/db/schema/task.schema';

export class ActionTaskMaterialDto {
  @IsString()
  @Expose()
  taskId: string;

  @IsString()
  @IsOptional()
  @Expose()
  title?: string;

  @IsEnum(TaskType)
  @Expose()
  type: TaskType;

  @IsString()
  @IsOptional()
  @Expose()
  coverUrl?: string;

  @IsString()
  @IsOptional()
  @Expose()
  temp?: string;

  @IsString()
  @IsOptional()
  @Expose()
  desc?: string;

  // 图片对象列表
  @IsOptional()
  @Expose()
  imageList?: any;
}
