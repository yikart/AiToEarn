/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: materialGroup MaterialGroup
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator'
import { TableDto } from 'src/common/dto/table.dto'
import {
  MaterialType,
  UpdateMaterialGroup,
} from 'src/transports/content/common'

export class MaterialGroupIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string
}

export class CreateMaterialGroupDto {
  @ApiProperty({ description: '素材类型', enum: MaterialType })
  @IsEnum(MaterialType, { message: '素材类型' })
  @Expose()
  type: MaterialType

  @ApiProperty({ title: '标题', required: true })
  @IsString({ message: '标题' })
  @Expose()
  readonly name: string

  @ApiProperty({ title: '描述', required: false })
  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly desc?: string
}

export class UpdateMaterialGroupDto implements UpdateMaterialGroup {
  @ApiProperty({ title: '标题', required: true })
  @IsString({ message: '标题' })
  @Expose()
  readonly name: string

  @ApiProperty({ title: '描述', required: false })
  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly desc?: string
}

export class MaterialGroupFilterDto {
  @IsString({ message: '标题' })
  @IsOptional()
  @Expose()
  readonly title?: string
}

export class MaterialGroupListDto {
  @ValidateNested()
  @Type(() => MaterialGroupFilterDto)
  @Expose()
  readonly filter: MaterialGroupFilterDto

  @ValidateNested()
  @Type(() => TableDto)
  @Expose()
  readonly page: TableDto
}
