/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: material Material
 */
import { ApiProperty } from '@nestjs/swagger'
import { createZodDto, TableDtoSchema, UserType } from '@yikart/common'
import { MaterialStatus, MaterialType, MediaType } from '@yikart/mongodb'
import { Expose } from 'class-transformer'
import {
  IsString,
} from 'class-validator'
import { z } from 'zod'

export class MaterialIdDto {
  @ApiProperty({ title: 'ID', required: true })
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string
}

export const MaterialMediaSchema = z.object({
  url: z.string(),
  type: z.nativeEnum(MediaType).describe('资源类型'),
  content: z.string().optional().describe('文本内容'),
  mediaId: z.string().optional().describe('资源ID'),
})

export const CreateMaterialSchema = z.object({
  groupId: z.string().describe('分组ID'),
  coverUrl: z.string().optional().describe('封面图'),
  mediaList: z.array(MaterialMediaSchema).describe('资源列表'),
  title: z.string().describe('标题'),
  desc: z.string().optional().describe('描述'),
  option: z.any().optional().describe('其他属性'),
  autoDeleteMedia: z.boolean().optional().describe('自动删除素材'),
})
export class CreateMaterialDto extends createZodDto(CreateMaterialSchema) { }

export const createMaterialTaskSchema = z.object({
  groupId: z.string().describe('分组ID'),
  num: z.number().describe('生成数量'),
  aiModelTag: z.string().describe('AI模型tag'),
  prompt: z.string().describe('提示词'),
  title: z.string().optional().describe('参考标题'),
  desc: z.string().optional().describe('参考描述'),
  mediaGroups: z.array(z.string()).min(1).max(5).describe('媒体组ID列表'),
  coverGroup: z.string().describe('参考描述'),
  option: z.object().optional().describe('高级设置'),
  textMax: z.number().optional().describe('最大文字数量'),
  language: z.string().optional().describe('语言'),
  type: z.enum([MaterialType.VIDEO, MaterialType.ARTICLE]).describe('草稿类型'),
  autoDeleteMedia: z.boolean().optional().describe('自动删除素材'),
})
export class CreateMaterialTaskDto extends createZodDto(createMaterialTaskSchema) { }

export const UpdateMaterialSchema = z.object({
  coverUrl: z.string().optional().describe('封面图'),
  mediaList: z.array(MaterialMediaSchema).describe('资源列表'),
  title: z.string().describe('标题'),
  desc: z.string().optional().describe('描述'),
  option: z.any().optional().describe('其他属性'),
  autoDeleteMedia: z.boolean().optional().describe('自动删除素材'),
})
export class UpdateMaterialDto extends createZodDto(UpdateMaterialSchema) { }

export const MaterialFilterSchema = z.object({
  userId: z.string().optional().describe('ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
  groupId: z.string().optional(),
  title: z.string().optional(),
  minUseCount: z.coerce.number().optional(),
  status: z.enum(MaterialStatus).optional().describe('草稿状态'),
  ids: z.array(z.string()).optional().describe('id列表'),
})
export class MaterialFilterDto extends createZodDto(MaterialFilterSchema) { }

export const MaterialListSchema = z.object({
  page: TableDtoSchema,
  filter: MaterialFilterSchema,
})
export class MaterialListDto extends createZodDto(MaterialListSchema) { }

export const AdminMaterialListByIdsFilterSchema = z.object({
  ids: z.array(z.string()).describe('id列表'),
})
export class AdminMaterialListByIdsFilterDto extends createZodDto(AdminMaterialListByIdsFilterSchema) { }

export const AdminMaterialListByIdsSchema = z.object({
  page: TableDtoSchema,
  filter: AdminMaterialListByIdsFilterSchema,
})
export class AdminMaterialListByIdsDto extends createZodDto(AdminMaterialListByIdsSchema) { }
