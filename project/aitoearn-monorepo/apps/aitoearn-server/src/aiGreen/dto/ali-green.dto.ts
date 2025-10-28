/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import {
  IsString,
} from 'class-validator'

export class TextBodyDto {
  @ApiProperty({ title: '文本内容', required: true })
  @IsString({ message: '文本内容' })
  @Expose()
  readonly content: string
}

export class ImageBodyDto {
  @ApiProperty({ title: '图片地址', required: true })
  @IsString({ message: '图片地址' })
  @Expose()
  readonly imageUrl: string
}

export class VideoBodyDto {
  @ApiProperty({ title: '视频地址', required: true })
  @IsString({ message: '视频地址' })
  @Expose()
  readonly url: string
}

export class VideoResultBodyDto {
  @ApiProperty({ title: '视频任务id', required: true })
  @IsString({ message: '视频任务id' })
  @Expose()
  readonly taskId: string
}
