/*
 * @Author: nevin
 * @Date: 2024-08-19 15:58:47
 * @LastEditTime: 2025-03-17 12:41:12
 * @LastEditors: nevin
 * @Description: Media media
 */
import { createZodDto, TableDtoSchema } from '@yikart/common'
import { MediaType } from '@yikart/mongodb'
import { z } from 'zod'
import { fileUtil } from '../../util/file.util'

export const MediaIdSchema = z.object({
  id: z.string().describe('ID'),
})
export class MediaIdDto extends createZodDto(MediaIdSchema) {}

export const CreateMediaSchema = z.object({
  groupId: z.string().describe('组ID'),
  materialId: z.string().optional().describe('素材ID'),
  type: z.enum(MediaType).describe('类型'),
  url: fileUtil.zodTrimHost().describe('文件链接'),
  thumbUrl: fileUtil.zodTrimHost().optional().describe('缩略图'),
  title: z.string().describe('标题'),
  desc: z.string().describe('描述'),
})
export class CreateMediaDto extends createZodDto(CreateMediaSchema) {}

export const MediaFilterSchema = z.object({
  groupId: z.string().optional().describe('组ID'),
  type: z.enum(MediaType).optional().describe('类型'),
  useCount: z.coerce.number().optional().describe('use conut (min)'),
})
export class MediaFilterDto extends createZodDto(MediaFilterSchema, 'MediaFilterDto') {}

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
