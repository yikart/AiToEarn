import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { z } from 'zod'

export const listBrowserProfilesSchema = z.object({
  accountId: z.string().optional(),
  profileId: z.string().optional(),
  cloudSpaceId: z.string().optional(),
  ...PaginationDtoSchema.shape,
})

export class ListBrowserProfilesDto extends createZodDto(listBrowserProfilesSchema) {}
