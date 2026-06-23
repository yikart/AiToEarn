import { z } from 'zod'
import { ChannelPaginationMode } from './platforms.interface'

export const ChannelPaginationMetadataVoSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal(ChannelPaginationMode.Cursor).describe('分页模式'),
    defaultLimit: z.number().int().positive().describe('默认数量'),
    maxLimit: z.number().int().positive().describe('最大数量'),
    supportsPrevious: z.boolean().describe('是否支持上一页'),
  }),
  z.object({
    mode: z.literal(ChannelPaginationMode.Page).describe('分页模式'),
    defaultPageSize: z.number().int().positive().describe('默认每页数量'),
    maxPageSize: z.number().int().positive().describe('最大每页数量'),
    supportsTotal: z.boolean().describe('是否返回总数'),
  }),
  z.object({
    mode: z.literal(ChannelPaginationMode.None).describe('分页模式'),
  }),
]).describe('分页能力元数据')

export const ChannelPaginationResultVoSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal(ChannelPaginationMode.Cursor).describe('分页模式'),
    nextCursor: z.string().optional().describe('下一页游标'),
    previousCursor: z.string().optional().describe('上一页游标'),
    hasNext: z.boolean().describe('是否有下一页'),
    hasPrevious: z.boolean().describe('是否有上一页'),
    limit: z.number().int().positive().describe('每页数量'),
  }),
  z.object({
    mode: z.literal(ChannelPaginationMode.Page).describe('分页模式'),
    page: z.number().int().positive().describe('页码'),
    pageSize: z.number().int().positive().describe('每页数量'),
    total: z.number().int().nonnegative().optional().describe('总数'),
    hasNext: z.boolean().describe('是否有下一页'),
    hasPrevious: z.boolean().describe('是否有上一页'),
  }),
  z.object({
    mode: z.literal(ChannelPaginationMode.None).describe('分页模式'),
  }),
])
