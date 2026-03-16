import z from 'zod'
import { Pagination } from '../dtos'
import { createZodDto } from '../utils'

export function createPaginationVo<T>(dataSchema: z.ZodType<T>, id?: string) {
  const PaginationVoSchema = z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    totalPages: z.number().int(),
    total: z.number().int(),
    list: z.array(dataSchema),
  })

  class PaginationVo extends createZodDto(PaginationVoSchema, id) {
    constructor(list: T[], total: number, pagination: Pagination) {
      super()
      Object.assign(this, PaginationVo.create({
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: Math.ceil(total / pagination.pageSize),
        total,
        list,
      }))
    }
  }

  return PaginationVo
}

export interface PaginationVo<T> {
  page: number
  pageSize: number
  totalPages: number
  total: number
  list: T[]
}
