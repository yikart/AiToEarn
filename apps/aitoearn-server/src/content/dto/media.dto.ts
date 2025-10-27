/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: Media media
 */
import { ApiProperty } from '@nestjs/swagger'
import { createZodDto, TableDtoSchema } from '@yikart/common'
import { MediaType } from '@yikart/mongodb'
import { Expose } from 'class-transformer'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { z } from 'zod'

export class MediaIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string
}

export class CreateMediaDto {
  @ApiProperty({ title: '组ID', required: true })
  @IsString({ message: '组ID' })
  @Expose()
  readonly groupId: string

  @ApiProperty({ title: '素材ID', required: false })
  @IsString({ message: '素材ID' })
  @IsOptional()
  @Expose()
  readonly materialId?: string

  @ApiProperty({
    title: '类型',
    required: true,
    enum: MediaType,
    description: '类型',
  })
  @IsEnum(MediaType, { message: '类型' })
  @Expose()
  readonly type: MediaType

  @ApiProperty({ title: '文件链接', required: true })
  @IsString({ message: '文件链接' })
  @Expose()
  readonly url: string

  @ApiProperty({ title: '缩略图', required: false })
  @IsString({ message: '缩略图' })
  @IsOptional()
  @Expose()
  readonly thumbUrl?: string

  @ApiProperty({ title: '标题', required: true })
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @ApiProperty({ title: '描述', required: true })
  @IsString({ message: '描述' })
  @Expose()
  readonly desc: string
}

export const MediaFilterSchema = z.object({
  groupId: z.string().optional().describe('组ID'),
  type: z.enum(MediaType).optional().describe('类型'),
  useCount: z.number().optional().describe('使用次数(大于该值)'),
})
export class MediaFilterDto extends createZodDto(MediaFilterSchema) {}

export const MediaListSchema = z.object({
  page: TableDtoSchema,
  filter: MediaFilterSchema,
})
export class MediaListDto extends createZodDto(MediaListSchema) {}

const addUseCountOfListSchema = z.object({
  ids: z.array(z.string()).min(1).describe('ID列表'),
})
export class AddUseCountOfListDto extends createZodDto(addUseCountOfListSchema) {}

const MediaIdsSchema = z.object({
  ids: z.array(z.string()).min(1).describe('ID列表'),
})
export class MediaIdsDto extends createZodDto(MediaIdsSchema) {}
