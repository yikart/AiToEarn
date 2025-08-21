import { createZodDto, PaginationDtoSchema } from '@aitoearn/common'
import { z } from 'zod'

export const listBrowserProfilesSchema = z.object({
  accountId: z.string().optional(),
  profileId: z.string().optional(),
  environmentId: z.string().optional(),
  ...PaginationDtoSchema.shape,
})

export class ListBrowserProfilesDto extends createZodDto(listBrowserProfilesSchema) {}
