/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2024-10-17 19:07:10
 * @LastEditors: nevin
 * @Description: AI工具
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsEnum, IsObject, IsString } from 'class-validator'

export class TextModerationDto {
  @ApiProperty({ title: '内容', required: true })
  @IsString({ message: '内容' })
  @Expose()
  readonly content: string
}

export class KwaiSignDto {
  @ApiProperty({
    description: '请求体的 JSON 内容',
    type: 'object',
    additionalProperties: true,
    example: { key1: 'value1', key2: 123 },
  })
  @IsObject()
  @Expose()
  json: Record<string, any>

  @ApiProperty({
    description: '请求类型，form-data 或 json',
    enum: ['form-data', 'json'],
    example: 'json',
  })
  @IsEnum(['form-data', 'json'])
  @Expose()
  type: 'form-data' | 'json'
}
