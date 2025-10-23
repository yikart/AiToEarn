/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: Media media
 */
import { ApiProperty } from '@nestjs/swagger'
import { createZodDto, TableDto } from '@yikart/common'
import { MediaType } from '@yikart/mongodb'
import { Expose, Type } from 'class-transformer'
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator'
import { z } from 'zod'

const addUseCountOfListSchema = z.object({
  ids: z.array(z.string()).min(1).describe('ID列表'),
})
export class AddUseCountOfListDto extends createZodDto(addUseCountOfListSchema) {}

export class MediaIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string
}

export class CreateMediaDto {
  @ApiProperty({ title: '组ID', required: false })
  @IsString({ message: '组ID' })
  @IsOptional()
  @Expose()
  readonly groupId?: string

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

export class MediaFilterDto {
  @ApiProperty({ title: '组ID', required: false })
  @IsString({ message: '组ID' })
  @IsOptional()
  @Expose()
  readonly groupId?: string
}

export class MediaListDto {
  @ValidateNested()
  @Type(() => MediaFilterDto)
  @Expose()
  readonly filter: MediaFilterDto

  @ValidateNested()
  @Type(() => TableDto)
  @Expose()
  readonly page: TableDto
}
