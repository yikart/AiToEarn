import { z } from 'zod'

import {
  MaterialStatus,
  MaterialType,
  MediaType,
  PubStatus,
  PubType,
} from '../enums'

// ---------------------------------------------------------------------------
// PubRecord
// ---------------------------------------------------------------------------

export const PubRecordSchema = z.object({
  id: z.string().describe('记录 ID'),
  userId: z.string().describe('用户 ID'),
  accountId: z.string().describe('账号 ID'),
  commonCoverPath: z.string().optional().describe('通用封面路径'),
  coverPath: z.string().optional().describe('封面路径'),
  desc: z.string().describe('描述'),
  publishTime: z.coerce.date().optional().describe('发布时间'),
  status: z.enum(PubStatus).describe('发布状态'),
  timingTime: z.coerce.date().optional().describe('定时时间'),
  title: z.string().describe('标题'),
  type: z.enum(PubType).describe('发布类型'),
  videoPath: z.string().optional().describe('视频路径'),
})
export interface PubRecord extends z.infer<typeof PubRecordSchema> {}

// ---------------------------------------------------------------------------
// MaterialMedia
// ---------------------------------------------------------------------------

export const MaterialMediaSchema = z.object({
  url: z.string().describe('媒体 URL'),
  type: z.enum(MediaType).describe('媒体类型'),
  thumbUrl: z.string().optional().describe('缩略图 URL'),
  content: z.string().optional().describe('内容'),
})
export interface MaterialMedia extends z.infer<typeof MaterialMediaSchema> {}

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

export const MaterialSchema = z.object({
  id: z.string().describe('素材 ID'),
  userId: z.string().describe('用户 ID'),
  groupId: z.string().optional().describe('分组 ID'),
  type: z.enum(MaterialType).describe('素材类型'),
  coverUrl: z.string().optional().describe('封面 URL'),
  mediaList: z.array(MaterialMediaSchema).describe('媒体列表'),
  title: z.string().describe('标题'),
  desc: z.string().describe('描述'),
  status: z.enum(MaterialStatus).describe('素材状态'),
  option: z.record(z.string(), z.any()).describe('额外选项'),
  useCount: z.number().optional().describe('使用次数'),
  model: z.string().optional().describe('AI 生成模型'),
  generationParams: z.record(z.string(), z.any()).optional().describe('AI 生成参数（prompt、aspectRatio、duration 等）'),
  createAt: z.coerce.date().describe('创建时间'),
  updatedAt: z.coerce.date().describe('更新时间'),
})
export interface Material extends z.infer<typeof MaterialSchema> {}

// ---------------------------------------------------------------------------
// NewMaterial
// ---------------------------------------------------------------------------

export const NewMaterialSchema = z.object({
  groupId: z.string().describe('分组 ID'),
  coverUrl: z.string().optional().describe('封面 URL'),
  mediaList: z.array(MaterialMediaSchema).describe('媒体列表'),
  title: z.string().describe('标题'),
  desc: z.string().optional().describe('描述'),
  location: z.array(z.number()).optional().describe('位置坐标'),
  option: z.record(z.string(), z.any()).optional().describe('额外选项'),
})
export interface NewMaterial extends z.infer<typeof NewMaterialSchema> {}

// ---------------------------------------------------------------------------
// MediaUrlInfo
// ---------------------------------------------------------------------------

export const MediaUrlInfoSchema = z.object({
  url: z.string().describe('媒体 URL'),
  num: z.number().describe('数量'),
  type: z.enum(MediaType).describe('媒体类型'),
})
export interface MediaUrlInfo extends z.infer<typeof MediaUrlInfoSchema> {}

// ---------------------------------------------------------------------------
// UpMaterial
// ---------------------------------------------------------------------------

export const UpMaterialSchema = z.object({
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('描述'),
  option: z.record(z.string(), z.any()).optional().describe('额外选项'),
})
export interface UpMaterial extends z.infer<typeof UpMaterialSchema> {}

// ---------------------------------------------------------------------------
// MaterialFilter
// ---------------------------------------------------------------------------

export const MaterialFilterSchema = z.object({
  userId: z.string().describe('用户 ID'),
  title: z.string().optional().describe('标题筛选'),
  groupId: z.string().optional().describe('分组 ID 筛选'),
})
export interface MaterialFilter extends z.infer<typeof MaterialFilterSchema> {}

// ---------------------------------------------------------------------------
// MaterialGroup
// ---------------------------------------------------------------------------

export const MaterialGroupSchema = z.object({
  id: z.string().describe('分组 ID'),
  userId: z.string().describe('用户 ID'),
  userType: z.string().optional().describe('用户类型'),
  title: z.string().describe('标题'),
  desc: z.string().optional().describe('描述'),
  platform: z.string().optional().describe('平台'),
  createAt: z.coerce.date().describe('创建时间'),
  updatedAt: z.coerce.date().describe('更新时间'),
})
export interface MaterialGroup extends z.infer<typeof MaterialGroupSchema> {}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export const MediaSchema = z.object({
  id: z.string().describe('媒体 ID'),
  userId: z.string().describe('用户 ID'),
  userType: z.string().optional().describe('用户类型'),
  groupId: z.string().optional().describe('分组 ID'),
  materialId: z.string().optional().describe('素材 ID'),
  type: z.enum(MaterialType).describe('素材类型'),
  url: z.string().describe('URL'),
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('描述'),
  createAt: z.coerce.date().describe('创建时间'),
  updatedAt: z.coerce.date().describe('更新时间'),
})
export interface Media extends z.infer<typeof MediaSchema> {}

// ---------------------------------------------------------------------------
// NewMedia
// ---------------------------------------------------------------------------

export const NewMediaSchema = z.object({
  userId: z.string().describe('用户 ID'),
  userType: z.string().optional().describe('用户类型'),
  groupId: z.string().optional().describe('分组 ID'),
  materialId: z.string().optional().describe('素材 ID'),
  type: z.enum(MediaType).describe('媒体类型'),
  url: z.string().describe('URL'),
  thumbUrl: z.string().optional().describe('缩略图 URL'),
  title: z.string().optional().describe('标题'),
  desc: z.string().optional().describe('描述'),
})
export interface NewMedia extends z.infer<typeof NewMediaSchema> {}

// ---------------------------------------------------------------------------
// MediaGroup
// ---------------------------------------------------------------------------

export const MediaGroupSchema = z.object({
  _id: z.string().describe('MongoDB _id'),
  id: z.string().describe('分组 ID'),
  userId: z.string().describe('用户 ID'),
  title: z.string().describe('标题'),
  desc: z.string().optional().describe('描述'),
  createAt: z.coerce.date().describe('创建时间'),
  updatedAt: z.coerce.date().describe('更新时间'),
  mediaList: z
    .object({
      list: z.array(MediaSchema).describe('媒体列表'),
      total: z.number().describe('总数'),
    })
    .optional()
    .describe('媒体列表信息'),
})
export interface MediaGroup extends z.infer<typeof MediaGroupSchema> {}

// ---------------------------------------------------------------------------
// NewMaterialGroup
// ---------------------------------------------------------------------------

export const NewMaterialGroupSchema = z.object({
  type: z.enum(MaterialType).describe('素材类型'),
  userId: z.string().describe('用户 ID'),
  userType: z.string().optional().describe('用户类型'),
  name: z.string().describe('分组名称'),
  desc: z.string().optional().describe('描述'),
  platform: z.string().optional().describe('平台'),
})
export interface NewMaterialGroup extends z.infer<typeof NewMaterialGroupSchema> {}

// ---------------------------------------------------------------------------
// UpdateMaterialGroup
// ---------------------------------------------------------------------------

export const UpdateMaterialGroupSchema = z.object({
  name: z.string().describe('分组名称'),
  desc: z.string().optional().describe('描述'),
  platform: z.string().nullable().optional().describe('平台'),
})
export interface UpdateMaterialGroup extends z.infer<typeof UpdateMaterialGroupSchema> {}
