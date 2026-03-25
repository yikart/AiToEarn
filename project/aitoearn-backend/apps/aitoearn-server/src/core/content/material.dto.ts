import { AccountType, createZodDto, FileUtil, TableDto } from '@yikart/common'
import { MaterialStatus, MaterialType, MediaType } from '@yikart/mongodb'
import { z } from 'zod'

const MaterialIdSchema = z.object({
  id: z.string().describe('草稿ID'),
})
export class MaterialIdDto extends createZodDto(MaterialIdSchema) { }

export const MaterialMediaSchema = z.object({
  id: z.string().optional().describe('资源ID'),
  url: FileUtil.zodTrimHost(),
  type: z.enum(MediaType).describe('资源类型'),
  thumbUrl: FileUtil.zodTrimHost().optional().describe('缩略图'),
  content: z.string().optional().describe('文本内容'),
  mediaId: z.string().optional().describe('资源ID'),
})

export const CreateMaterialSchema = z.object({
  groupId: z.string().describe('分组ID'),
  coverUrl: FileUtil.zodTrimHost().optional().describe('封面图'),
  mediaList: z.array(MaterialMediaSchema).describe('资源列表'),
  title: z.string().describe('标题'),
  desc: z.string().optional().describe('描述'),
  topics: z.array(z.string()).optional().default([]).describe('话题'),
  option: z.any().optional().describe('其他属性'),
  autoDeleteMedia: z.boolean().optional().describe('自动删除草稿'),
  type: z.enum(MaterialType).describe('草稿类型'),
  maxUseCount: z.number().int().positive().optional().describe('最大使用次数'),
  accountTypes: z.array(z.enum(AccountType)).optional().default([]).describe('适用的频道类型'),
})
export class CreateMaterialDto extends createZodDto(CreateMaterialSchema) { }

export const UpdateMaterialSchema = z.object({
  coverUrl: FileUtil.zodTrimHost().optional().describe('封面图'),
  mediaList: z.array(MaterialMediaSchema).describe('资源列表'),
  title: z.string().describe('标题'),
  desc: z.string().optional().describe('描述'),
  topics: z.array(z.string()).optional().describe('话题'),
  option: z.any().optional().describe('其他属性'),
  autoDeleteMedia: z.boolean().optional().describe('自动删除草稿'),
  maxUseCount: z.number().int().positive().optional().describe('最大使用次数'),
  accountTypes: z.array(z.enum(AccountType)).optional().describe('适用的频道类型'),
})
export class UpdateMaterialDto extends createZodDto(UpdateMaterialSchema) { }

export const MaterialFilterSchema = z.object({
  title: z.string({ message: '标题' }).optional(),
  groupId: z.string({ message: '组ID' }).optional(),
  status: z.enum(MaterialStatus, { message: '草稿状态' }).optional(),
  type: z.enum(MaterialType, { message: '草稿类型' }).optional(),
  useCount: z.coerce.number().optional().describe('最小使用次数'),
})

export class MaterialFilterDto extends createZodDto(MaterialFilterSchema) { }

const MaterialListSchema = z.object({
  filter: MaterialFilterSchema,
  page: TableDto.schema,
})

export class MaterialListDto extends createZodDto(MaterialListSchema) { }

const MediaIdsSchema = z.object({
  ids: z.array(z.string()).min(1).describe('ID列表'),
})
export class MaterialIdsDto extends createZodDto(MediaIdsSchema) { }

const DeleteByUseCountSchema = z.object({
  groupId: z.string().describe('草稿箱ID'),
  minUseCount: z.number().int().min(0).describe('最小使用次数（大于等于该值的草稿将被删除）'),
})
export class DeleteByUseCountDto extends createZodDto(DeleteByUseCountSchema, 'DeleteByUseCountDto') {}

const GetOptimalMaterialSchema = z.object({
  groupId: z.string().describe('草稿箱ID'),
  accountType: z.enum(AccountType).describe('平台类型'),
})
export class GetOptimalMaterialDto extends createZodDto(GetOptimalMaterialSchema) { }
