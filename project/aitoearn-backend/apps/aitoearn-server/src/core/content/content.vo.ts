import { AccountType, createZodDto, FileUtil, UserType } from '@yikart/common'
import { z } from 'zod'

const fileUrlSchema = () => FileUtil.zodBuildUrl().nullable().optional()
const metadataSchema = z.object({
  size: z.number().optional().describe('文件大小'),
  mimeType: z.string().optional().describe('MIME 类型'),
}).optional().describe('文件元数据')

export const MediaVoSchema = z.object({
  _id: z.unknown().optional().describe('Mongo ID'),
  id: z.string().optional().describe('媒体 ID'),
  userId: z.string().optional().describe('用户 ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
  groupId: z.string().optional().describe('媒体分组 ID'),
  materialGroupId: z.string().optional().describe('素材分组 ID'),
  type: z.string().optional().describe('媒体类型'),
  url: fileUrlSchema().describe('媒体 URL'),
  thumbUrl: fileUrlSchema().describe('缩略图 URL'),
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('描述'),
  useCount: z.number().optional().describe('使用次数'),
  metadata: metadataSchema,
  createdAt: z.coerce.date().optional().describe('创建时间'),
  updatedAt: z.coerce.date().optional().describe('更新时间'),
})
export class MediaVo extends createZodDto(MediaVoSchema, 'MediaVo') {}

export const MediaListVoSchema = z.object({
  total: z.number().describe('总数'),
  list: z.array(MediaVoSchema).describe('媒体列表'),
})
export class MediaListVo extends createZodDto(MediaListVoSchema, 'MediaListVo') {}

export const MaterialMediaVoSchema = z.object({
  url: fileUrlSchema().describe('媒体 URL'),
  thumbUrl: fileUrlSchema().describe('缩略图 URL'),
  metadata: metadataSchema,
  type: z.string().optional().describe('媒体类型'),
  content: z.string().optional().describe('内容'),
  mediaId: z.string().optional().describe('媒体 ID'),
})

export const MaterialVoSchema = z.object({
  _id: z.unknown().optional().describe('Mongo ID'),
  id: z.string().optional().describe('素材 ID'),
  userId: z.string().optional().describe('用户 ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
  groupId: z.string().optional().describe('素材分组 ID'),
  materialGroupId: z.string().optional().describe('素材分组 ID'),
  taskId: z.string().optional().describe('任务 ID'),
  source: z.string().optional().describe('素材来源'),
  type: z.string().optional().describe('素材类型'),
  coverUrl: fileUrlSchema().describe('封面 URL'),
  mediaList: z.array(MaterialMediaVoSchema).optional().describe('媒体列表'),
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('描述'),
  topics: z.array(z.string()).optional().describe('话题'),
  option: z.any().optional().describe('发布选项'),
  status: z.number().optional().describe('素材状态'),
  message: z.string().optional().describe('状态消息'),
  useCount: z.number().optional().describe('使用次数'),
  maxUseCount: z.number().nullable().optional().describe('最大使用次数'),
  autoDeleteMedia: z.boolean().optional().describe('是否自动删除媒体'),
  model: z.string().optional().describe('模型'),
  generationParams: z.record(z.string(), z.unknown()).optional().describe('AI 生成参数'),
  accountTypes: z.array(z.enum(AccountType)).optional().describe('适用账号类型'),
  createdAt: z.coerce.date().optional().describe('创建时间'),
  updatedAt: z.coerce.date().optional().describe('更新时间'),
})
export class MaterialVo extends createZodDto(MaterialVoSchema, 'MaterialVo') {}

export const MaterialListVoSchema = z.object({
  total: z.number().describe('总数'),
  list: z.array(MaterialVoSchema).describe('素材列表'),
})
export class MaterialListVo extends createZodDto(MaterialListVoSchema, 'MaterialListVo') {}

export const MediaGroupWithMediaListVoSchema = z.object({
  _id: z.unknown().optional().describe('Mongo ID'),
  id: z.string().optional().describe('媒体分组 ID'),
  userId: z.string().optional().describe('用户 ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
  type: z.string().optional().describe('媒体类型'),
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('描述'),
  isDefault: z.boolean().optional().describe('是否默认分组'),
  mediaList: MediaListVoSchema.optional().describe('媒体列表'),
  createdAt: z.coerce.date().optional().describe('创建时间'),
  updatedAt: z.coerce.date().optional().describe('更新时间'),
})
export class MediaGroupWithMediaListVo extends createZodDto(
  MediaGroupWithMediaListVoSchema,
  'MediaGroupWithMediaListVo',
) {}

export const MediaGroupListVoSchema = z.object({
  total: z.number().describe('总数'),
  list: z.array(MediaGroupWithMediaListVoSchema).describe('媒体分组列表'),
})
export class MediaGroupListVo extends createZodDto(MediaGroupListVoSchema, 'MediaGroupListVo') {}
