import z from 'zod'

export const PaginationDtoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(10),
})

export type Pagination = z.infer<typeof PaginationDtoSchema>
