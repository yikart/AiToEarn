/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-05-13 16:00:00
 * @LastEditors: nevin
 * @Description: mediaGroup MediaGroup
 */
import { createZodDto, TableDtoSchema } from '@yikart/common'
import { MediaType } from '@yikart/mongodb'
import { z } from 'zod'

const MediaGroupIdSchema = z.object({
  id: z.string().describe('ID'),
})

export class MediaGroupIdDto extends createZodDto(MediaGroupIdSchema) {}

const CreateMediaGroupSchema = z.object({
  type: z.enum(MediaType).describe('类型'),
  title: z.string().describe('标题'),
  desc: z.string().describe('描述'),
})

export class CreateMediaGroupDto extends createZodDto(CreateMediaGroupSchema) {}

export const UpdateMediaSchema = z.object({
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('描述'),
})
export class UpdateMediaGroupDto extends createZodDto(UpdateMediaSchema) {}

const MediaGroupFilterSchema = z.object({
  title: z.string().optional().describe('标题'),
  type: z.enum(MediaType).optional().describe('类型'),
})

export class MediaGroupFilterDto extends createZodDto(MediaGroupFilterSchema) {}

const MediaGroupListSchema = z.object({
  filter: MediaGroupFilterSchema.optional().describe('过滤条件'),
  page: TableDtoSchema.describe('分页信息'),
})

export class MediaGroupListDto extends createZodDto(MediaGroupListSchema) {}
