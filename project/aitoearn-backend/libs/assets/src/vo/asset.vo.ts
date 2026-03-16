import { createPaginationVo, createZodDto, FileUtil, UserType } from '@yikart/common'
import { AssetStatus, AssetType } from '@yikart/mongodb'
import { z } from 'zod'
import { AssetMetadataSchema } from '../dto'

export const AssetVoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userType: z.enum(UserType),
  path: z.string(),
  url: FileUtil.zodBuildUrl(),
  type: z.enum(AssetType),
  status: z.enum(AssetStatus),
  size: z.number().optional(),
  mimeType: z.string(),
  filename: z.string().optional(),
  metadata: AssetMetadataSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export class AssetVo extends createZodDto(AssetVoSchema, 'AssetVo') {}

export class AssetListVo extends createPaginationVo(AssetVoSchema, 'AssetListVo') {}
