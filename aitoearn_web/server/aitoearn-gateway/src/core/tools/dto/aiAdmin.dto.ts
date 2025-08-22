/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2024-10-17 19:07:10
 * @LastEditors: nevin
 * @Description: AI工具
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import {
  IsString,
} from 'class-validator'

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

export class AdminAiIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string
}
