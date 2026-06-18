import { z } from 'zod'
import { ChannelPaginationDirection } from './platforms.interface'

export const ChannelCursorPaginationInputSchema = z.union([
  z.object({
    cursor: z.string().describe('分页游标'),
    limit: z.coerce.number().int().positive().optional().describe('每页数量，不传时使用平台默认值'),
    direction: z.enum(ChannelPaginationDirection).optional().describe('分页方向，不传时默认下一页'),
  }),
  z.object({
    limit: z.coerce.number().int().positive().describe('每页数量，不传时使用平台默认值'),
    direction: z.literal(ChannelPaginationDirection.Next).optional().describe('分页方向，不传时默认下一页'),
  }),
  z.object({
    direction: z.literal(ChannelPaginationDirection.Next).describe('分页方向，不传时默认下一页'),
  }),
])

export const ChannelPagePaginationInputSchema = z.object({
  page: z.coerce.number().int().positive().describe('页码'),
  pageSize: z.coerce.number().int().positive().describe('每页数量'),
})

export const ChannelPaginationInputSchema = z.union([
  ChannelPagePaginationInputSchema,
  ChannelCursorPaginationInputSchema,
])

export const ChannelPaginationInputWithDefaultSchema = ChannelPaginationInputSchema
  .optional()
  .default({} as z.infer<typeof ChannelPaginationInputSchema>)
