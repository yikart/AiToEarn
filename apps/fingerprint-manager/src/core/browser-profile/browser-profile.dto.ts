import { createZodDto, PaginationDtoSchema } from '@aitoearn/common'
import { z } from 'zod'

export const createBrowserProfileSchema = z.object({
  environmentId: z.string().optional(),
  accountId: z.string(),
  profileName: z.string(),
  config: z.record(z.string(), z.unknown()).optional(),
})

export const listBrowserProfilesSchema = z.object({
  accountId: z.string().optional(),
  profileId: z.string().optional(),
  environmentId: z.string().optional(),
  ...PaginationDtoSchema.shape,
})

export const releaseBrowserProfileSchema = z.object({
  profileId: z.string(),
})

export const fingerprintConfigSchema = z.object({
  userAgent: z.string(),
  viewport: z.object({
    width: z.number(),
    height: z.number(),
  }),
  timezone: z.string(),
  language: z.string(),
  webgl: z.record(z.string(), z.unknown()),
  canvas: z.record(z.string(), z.unknown()),
  geolocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
})

export class CreateBrowserProfileDto extends createZodDto(createBrowserProfileSchema) {}
export class ListBrowserProfilesDto extends createZodDto(listBrowserProfilesSchema) {}
export class ReleaseBrowserProfileDto extends createZodDto(releaseBrowserProfileSchema) {}
export class FingerprintConfigDto extends createZodDto(fingerprintConfigSchema) {}
