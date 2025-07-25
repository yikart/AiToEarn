/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2024-10-17 19:07:10
 * @LastEditors: nevin
 * @Description: AI工具
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'
import { FireflycardTempTypes } from '../ai.service'

export class AdminFireflycardDto {
  @ApiProperty({ title: '内容', required: true })
  @IsString({ message: '内容' })
  @Expose()
  readonly content: string

  @ApiProperty({ description: '模板', enum: FireflycardTempTypes })
  @IsEnum(FireflycardTempTypes)
  @Expose()
  temp: FireflycardTempTypes

  @ApiProperty({ title: '标题', required: false })
  @IsString({ message: '标题' })
  @IsOptional()
  @Expose()
  readonly title?: string
}

export class AdminAiMarkdownDto {
  @ApiProperty({ title: '系统提示词', required: true })
  @IsString({ message: '系统提示词' })
  @Expose()
  readonly prompt: string

  @ApiProperty({ title: '内容', required: true })
  @IsString({ message: '内容' })
  @Expose()
  readonly content: string
}

export class AdminJmTaskDto {
  @ApiProperty({ title: '提示词', required: true })
  @IsString({ message: '提示词' })
  @Expose()
  readonly prompt: string

  @ApiProperty({ title: '宽度', required: true })
  @Min(520, { message: '最小520' })
  @Max(1300, { message: '最大1300' })
  @IsNumber(
    {
      allowNaN: false,
    },
    { message: '宽度' },
  )
  @Type(() => Number)
  @Expose()
  readonly width: number

  @ApiProperty({ title: '高度', required: true })
  @Min(520, { message: '最小520' })
  @Max(1300, { message: '最大1300' })
  @IsNumber(
    {
      allowNaN: false,
    },
    { message: '高度' },
  )
  @Type(() => Number)
  @Expose()
  readonly height: number

  @ApiProperty({ title: 'sessionIds', required: true, type: [String] })
  @IsString({ each: true, message: 'sessionIds' })
  @Expose()
  readonly sessionIds: string[]
}

export class AdminAiIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string
}
