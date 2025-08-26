/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: material Material
 */
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { TableDto } from 'src/common/dto/table.dto'
import {
  MaterialMedia,
  MaterialStatus,
  MediaType,
  NewMaterialTask,
} from 'src/transports/content/common'

export class MaterialIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string
}

class MaterialMediaDto implements MaterialMedia {
  @ApiProperty({ title: '资源链接', required: true })
  @IsString({ message: '资源链接' })
  @Expose()
  readonly url: string

  @ApiProperty({ title: '资源类型', required: true, enum: MediaType })
  @IsEnum(MediaType, { message: '资源类型' })
  @Expose()
  type: MediaType

  @ApiProperty({ title: '文本内容', required: false })
  @IsString({ message: '文本内容' })
  @IsOptional()
  @Expose()
  readonly content?: string
}

export class CreateMaterialDto {
  @ApiProperty({ title: '组ID', required: true })
  @IsString({ message: '组ID' })
  @Expose()
  readonly groupId: string

  @ApiProperty({ title: '封面图', required: false })
  @IsString({ message: '封面图' })
  @IsOptional()
  @Expose()
  readonly coverUrl?: string

  @ApiProperty({ title: '媒体数组', required: true, type: [MaterialMediaDto] })
  @IsArray({ message: '媒体数组必须是数组' })
  @ValidateNested({ each: true, message: '媒体数组中的每个元素必须是对象' })
  @Type(() => MaterialMediaDto)
  @Expose()
  mediaList: MaterialMediaDto[]

  @ApiProperty({ title: '标题', required: true })
  @IsString({ message: '标题' })
  @Expose()
  readonly title: string

  @ApiProperty({ title: '内容', required: false })
  @IsString({ message: '内容' })
  @IsOptional()
  @Expose()
  readonly desc?: string

  @ApiProperty({ title: '其他属性', required: false })
  @IsObject({ message: '其他属性' })
  @IsOptional()
  @Expose()
  readonly option?: Record<string, any>
}

export class CreateMaterialTaskDto implements NewMaterialTask {
  @ApiProperty({ title: '组ID', required: true })
  @IsString({ message: '组ID' })
  @Expose()
  readonly groupId: string

  @ApiProperty({ title: '生成数量', required: true })
  @IsNumber({ allowNaN: false }, { message: '生成数量' })
  @Type(() => Number)
  @Expose()
  readonly num: number

  @ApiProperty({ title: 'AI模型tag', required: true })
  @IsString({ message: 'AI模型tag' })
  @Expose()
  readonly aiModelTag: string

  @ApiProperty({ title: '提示词', required: true })
  @IsString({ message: '提示词' })
  @Expose()
  readonly prompt: string

  @ApiProperty({ title: '标题', required: false })
  @IsString({ message: '标题' })
  @IsOptional()
  @Expose()
  readonly title?: string

  @ApiProperty({ title: '描述', required: false })
  @IsString({ message: '描述' })
  @IsOptional()
  @Expose()
  readonly desc?: string

  // 媒体组数组验证：必须是字符串数组，最多包含5个元素
  @ApiProperty({ title: '使用的媒体组数组', required: true })
  @IsArray({ message: '媒体组必须是数组' })
  @IsString({ each: true, message: '媒体组数组中的每个元素必须是字符串' })
  @ArrayMaxSize(5, { message: '媒体组数组最多包含5个元素' })
  @ArrayMinSize(1, { message: '媒体组数组至少包含1个元素' })
  @Expose()
  readonly mediaGroups: string[]

  @ApiProperty({ title: '封面媒体组', required: true })
  @IsString({ message: '封面媒体组' })
  @Expose()
  readonly coverGroup: string

  // 高级设置对象验证：必须是对象类型，禁止使用any类型
  @ApiProperty({ title: '高级设置', required: false })
  @IsObject({ message: '高级设置必须是对象类型' })
  @IsOptional()
  @Expose()
  readonly option?: Record<string, any>

  @ApiProperty({ title: '最大文字数量', required: false })
  @IsNumber({ allowNaN: false }, { message: '最大文字数量' })
  @Type(() => Number)
  @IsOptional()
  @Expose()
  readonly textMax?: number

  @ApiProperty({ title: '语言', required: false })
  @IsString({ message: '语言' })
  @IsOptional()
  @Expose()
  readonly language?: '中文' | '英文'
}

export class UpdateMaterialDto {
  @ApiProperty({ title: '封面图', required: false })
  @IsString({ message: '封面图' })
  @IsOptional()
  @Expose()
  readonly coverUrl?: string

  @ApiProperty({ title: '媒体数组', required: true, type: [MaterialMediaDto] })
  @IsArray({ message: '媒体数组必须是数组' })
  @ValidateNested({ each: true, message: '媒体数组中的每个元素必须是对象' })
  @Type(() => MaterialMediaDto)
  @Expose()
  mediaList: MaterialMediaDto[]

  @ApiProperty({ title: '标题', required: true })
  @IsString({ message: '标题' })
  @Expose()
  title: string

  @ApiProperty({ title: '内容', required: false })
  @IsString({ message: '内容' })
  @IsOptional()
  @Expose()
  readonly desc?: string

  @ApiProperty({ title: '其他属性', required: false })
  @IsObject({ message: '其他属性' })
  @IsOptional()
  @Expose()
  readonly option?: Record<string, any>
}

export class MaterialFilterDto {
  @ApiProperty({ title: '标题', required: false })
  @IsString({ message: '标题' })
  @IsOptional()
  @Expose()
  readonly title?: string

  @ApiProperty({ title: '组ID', required: false })
  @IsString({ message: '组ID' })
  @IsOptional()
  @Expose()
  readonly groupId?: string

  @ApiProperty({ title: '草稿状态', required: false, enum: MaterialStatus })
  @IsEnum(MaterialStatus, { message: '草稿状态' })
  @IsOptional()
  @Expose()
  status?: MaterialStatus
}

export class MaterialListDto {
  @ValidateNested()
  @Type(() => MaterialFilterDto)
  @Expose()
  readonly filter: MaterialFilterDto

  @ValidateNested()
  @Type(() => TableDto)
  @Expose()
  readonly page: TableDto
}
