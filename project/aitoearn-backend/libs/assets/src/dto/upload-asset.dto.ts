import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { AssetType } from '@yikart/mongodb'
import { z } from 'zod'

/** 图片元数据 Schema */
export const ImageMetadataSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
})

/** 视频元数据 Schema */
export const VideoMetadataSchema = z.object({
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  duration: z.number().positive().optional(), // seconds
  cover: z.string().optional(), // 封面图 path
  bitrate: z.number().positive().optional(), // bps
  frameRate: z.number().positive().optional(), // fps
})

/** 音频元数据 Schema */
export const AudioMetadataSchema = z.object({
  duration: z.number().positive(), // seconds
  bitrate: z.number().positive().optional(), // bps
  sampleRate: z.number().positive().optional(), // Hz
  channels: z.number().positive().optional(),
})

/** Asset 元数据联合 Schema */
export const AssetMetadataSchema = z.union([
  ImageMetadataSchema,
  VideoMetadataSchema,
  AudioMetadataSchema,
])

export const UploadAssetDtoSchema = z.object({
  type: z.enum(AssetType),
  mimeType: z.string(),
  size: z.number().positive().optional(),
  filename: z.string().optional(),
  metadata: AssetMetadataSchema.optional(),
  expiresInSeconds: z.number().positive().optional(),
})
export class UploadAssetDto extends createZodDto(UploadAssetDtoSchema, 'UploadAssetDto') {}

export const ConfirmAssetDtoSchema = z.object({
  assetId: z.string(),
  size: z.number().positive().optional(),
  metadata: AssetMetadataSchema.optional(),
})
export class ConfirmAssetDto extends createZodDto(ConfirmAssetDtoSchema, 'ConfirmAssetDto') {}

export const ListAssetsDtoSchema = PaginationDtoSchema.extend({
  type: z.enum(AssetType).optional(),
})
export class ListAssetsDto extends createZodDto(ListAssetsDtoSchema, 'ListAssetsDto') {}

export const UploadFromUrlDtoSchema = z.object({
  url: z.url(),
  type: z.enum(AssetType),
  filename: z.string().optional(),
  metadata: AssetMetadataSchema.optional(),
})
export class UploadFromUrlDto extends createZodDto(UploadFromUrlDtoSchema, 'UploadFromUrlDto') {}

export const UploadFromBufferDtoSchema = z.object({
  type: z.enum(AssetType),
  mimeType: z.string(),
  filename: z.string().optional(),
  metadata: AssetMetadataSchema.optional(),
})
export class UploadFromBufferDto extends createZodDto(UploadFromBufferDtoSchema, 'UploadFromBufferDto') {}
