/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:26
 * @LastEditTime: 2025-03-03 17:34:24
 * @LastEditors: nevin
 * @Description: 任务
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  TaskArticle,
  TaskInteraction,
  TaskProduct,
  TaskPromotion,
  TaskType,
  TaskVideo,
} from '../../../db/schema/task.schema';
import { AccountType } from 'src/db/schema/account.schema';

export class CreateTaskDto {
  @ApiProperty({ description: '任务标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '任务描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '任务类型', enum: TaskType })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({ description: '任务主体属性' })
  @IsObject()
  dataInfo:
    | TaskVideo
    | TaskPromotion
    | TaskProduct
    | TaskArticle
    | TaskInteraction;

  @ApiProperty({ description: '任务配图URL' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ description: '附件地址列表' })
  @IsArray()
  fileList: string[];

  @ApiProperty({ description: '是否需要挂购物车' })
  @IsOptional()
  requiresShoppingCart?: boolean;

  @ApiProperty({ description: '收益' })
  @IsNumber()
  reward: number;

  @ApiProperty({ description: '招募人数' })
  @IsNumber()
  maxRecruits: number;

  @ApiProperty({ description: '任务截止时间' })
  @IsDate()
  deadline: Date;

  @ApiProperty({ description: '支持的账号类型列表' })
  @IsArray()
  @IsEnum(AccountType, { each: true })
  accountTypes: AccountType[];
}
