/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: blog Blog
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator'

export class CreateFeedBackDto {
  @ApiProperty({ title: '用户ID', required: true })
  @IsString({ message: '用户ID' })
  @Expose()
  readonly userId: string

  @ApiProperty({ title: '用户名称', required: true })
  @IsString({ message: '用户名称' })
  @Expose()
  readonly userName: string

  @ApiProperty({ title: '内容', required: true })
  @IsString({ message: '内容' })
  @Expose()
  readonly content: string

  @ApiProperty({ type: [String], description: '标识数组' })
  @IsArray()
  @IsString({ each: true, message: '字符串数组' })
  @IsOptional()
  @Expose()
  readonly tagList?: string[]

  @ApiProperty({ type: [String], description: '文件链接数组' })
  @IsArray()
  @IsString({ each: true, message: '文件链接' })
  @IsOptional()
  @Expose()
  readonly fileUrlList?: string[]
}

export class GetBlogListDto {
  @ApiProperty({
    title: '起始时间',
    required: false,
    type: [String],
    description: '时间范围数组，格式为[startDate, endDate]，格式YYYY-MM-DD',
    example: ['2023-01-01', '2023-12-31'],
  })
  @Type(() => Date) // 将传入的字符串自动转换为Date对象
  @IsArray({ message: '时间范围必须为数组' })
  @ArrayMinSize(2, { message: '时间范围需要两个元素' })
  @ArrayMaxSize(2, { message: '时间范围不能超过两个元素' })
  @Validate(
    (value: Date[]) => {
      return value
    },
    {
      each: true,
      message: '必须为有效的日期格式',
    },
  )
  @IsOptional()
  @Expose()
  readonly time?: [Date, Date]

  @ApiProperty({ type: String })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsString()
  @IsOptional()
  @Expose()
  userId?: string
}
