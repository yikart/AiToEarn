import { createZodDto } from '@yikart/common'
import { CloudSpaceRegion } from '@yikart/mongodb'
import { z } from 'zod'

export const createCloudSpaceSchema = z.object({
  userId: z.string(),
  region: z.enum(CloudSpaceRegion),
  profileName: z.string().optional(),
  accountGroupId: z.string(),
  month: z.int().min(1).default(1),
})
export class CreateCloudSpaceDto extends createZodDto(createCloudSpaceSchema) {}

export const getCloudSpaceStatusSchema = z.object({
  cloudSpaceId: z.string(),
})
export class GetCloudSpaceStatusDto extends createZodDto(getCloudSpaceStatusSchema) {}

export const deleteCloudSpaceSchema = z.object({
  cloudSpaceId: z.string(),
})
export class DeleteCloudSpaceDto extends createZodDto(deleteCloudSpaceSchema) {}

export const retryCloudSpaceSchema = z.object({
  cloudSpaceId: z.string(),
})
export class RetryCloudSpaceDto extends createZodDto(retryCloudSpaceSchema) {}
