/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: mediaGroup MediaGroup
 */
import { ApiProperty } from '@nestjs/swagger'
import { createZodDto, TableDto } from '@yikart/common'
import { MediaType } from '@yikart/mongodb'
import { Expose, Type } from 'class-transformer'
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator'
import { z } from 'zod'

export class MediaGroupIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string
}

export class CreateMediaGroupDto {
  @ApiProperty({
    title: '类型',
    required: true,
    enum: MediaType,
    description: '类型',
  })
  @IsEnum(MediaType, { message: '类型' })
  @Expose()
  readonly type: MediaType

  @ApiProperty({ title: '标题', required: true })
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @ApiProperty({ title: '描述', required: true })
  @IsString({ message: '描述' })
  @Expose()
  readonly desc: string
}

export const UpdateMediaSchema = z.object({
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('描述'),
})
export class UpdateMediaGroupDto extends createZodDto(UpdateMediaSchema) {}

export class MediaGroupFilterDto {
  @IsString({ message: '标题' })
  @IsOptional()
  @Expose()
  readonly title?: string

  @ApiProperty({
    title: '类型',
    required: false,
    enum: MediaType,
    description: '类型',
  })
  @IsEnum(MediaType, { message: '类型' })
  @IsOptional()
  @Expose()
  readonly type?: MediaType
}

export class MediaGroupListDto {
  @ValidateNested()
  @Type(() => MediaGroupFilterDto)
  @Expose()
  readonly filter: MediaGroupFilterDto

  @ValidateNested()
  @Type(() => TableDto)
  @Expose()
  readonly page: TableDto
}
