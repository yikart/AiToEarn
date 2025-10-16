import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { CloudSpaceRegion, CloudSpaceStatus } from '@yikart/mongodb'
import { z } from 'zod'

export const createCloudSpaceSchema = z.object({
  userId: z.string(),
  region: z.enum(CloudSpaceRegion),
  profileName: z.string().optional(),
  accountGroupId: z.string(),
  month: z.int().min(1).default(1),
})

export const listCloudSpacesSchema = z.object({
  userId: z.string().optional(),
  region: z.enum(CloudSpaceRegion).optional(),
  status: z.enum(CloudSpaceStatus).optional(),
  ...PaginationDtoSchema.shape,
})
export const listCloudSpacesByUserIdSchema = z.object({
  userId: z.string(),
  region: z.enum(CloudSpaceRegion).optional(),
  status: z.enum(CloudSpaceStatus).optional(),
})

export const getCloudSpaceStatusSchema = z.object({
  cloudSpaceId: z.string(),
})

export const deleteCloudSpaceSchema = z.object({
  cloudSpaceId: z.string(),
})

export const renewCloudSpaceSchema = z.object({
  cloudSpaceId: z.string(),
  month: z.int().min(1).default(1),
})

export const retryCloudSpaceSchema = z.object({
  cloudSpaceId: z.string(),
})

export class CreateCloudSpaceDto extends createZodDto(createCloudSpaceSchema) {}
export class ListCloudSpacesDto extends createZodDto(listCloudSpacesSchema) {}
export class ListCloudSpacesByUserIdDto extends createZodDto(listCloudSpacesByUserIdSchema) {}
export class GetCloudSpaceStatusDto extends createZodDto(getCloudSpaceStatusSchema) {}
export class DeleteCloudSpaceDto extends createZodDto(deleteCloudSpaceSchema) {}
export class RenewCloudSpaceDto extends createZodDto(renewCloudSpaceSchema) {}
export class RetryCloudSpaceDto extends createZodDto(retryCloudSpaceSchema) {}
