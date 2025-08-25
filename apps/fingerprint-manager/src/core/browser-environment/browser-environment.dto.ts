import { BrowserEnvironmentRegion, BrowserEnvironmentStatus, createZodDto, PaginationDtoSchema } from '@yikart/common'
import { z } from 'zod'

export const createBrowserEnvironmentSchema = z.object({
  userId: z.string(),
  region: z.enum(BrowserEnvironmentRegion),
  profileName: z.string().optional(),
})

export const listBrowserEnvironmentsSchema = z.object({
  userId: z.string().optional(),
  region: z.enum(BrowserEnvironmentRegion).optional(),
  status: z.enum(BrowserEnvironmentStatus).optional(),
  ...PaginationDtoSchema.shape,
})

export const getBrowserEnvironmentStatusSchema = z.object({
  environmentId: z.string(),
})

export const deleteBrowserEnvironmentSchema = z.object({
  environmentId: z.string(),
})

export class CreateBrowserEnvironmentDto extends createZodDto(createBrowserEnvironmentSchema) {}
export class ListBrowserEnvironmentsDto extends createZodDto(listBrowserEnvironmentsSchema) {}
export class GetBrowserEnvironmentStatusDto extends createZodDto(getBrowserEnvironmentStatusSchema) {}
export class DeleteBrowserEnvironmentDto extends createZodDto(deleteBrowserEnvironmentSchema) {}
