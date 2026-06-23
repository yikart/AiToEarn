import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ChannelPaginationInputSchema, ChannelPaginationInputWithDefaultSchema } from './platform-pagination.dto'
import { ChannelPaginationDirection } from './platforms.interface'

describe('channelPaginationInputSchema', () => {
  it('infers cursor pagination from cursor fields', () => {
    expect(ChannelPaginationInputSchema.parse({
      limit: 25,
      direction: ChannelPaginationDirection.Next,
    })).toEqual({
      limit: 25,
      direction: ChannelPaginationDirection.Next,
    })
  })

  it('requires cursor for previous cursor pagination', () => {
    expect(() => ChannelPaginationInputSchema.parse({
      direction: ChannelPaginationDirection.Previous,
    })).toThrow()

    expect(ChannelPaginationInputSchema.parse({
      cursor: 'cursor-1',
      direction: ChannelPaginationDirection.Previous,
    })).toEqual({
      cursor: 'cursor-1',
      direction: ChannelPaginationDirection.Previous,
    })
  })

  it('infers page pagination from page fields', () => {
    expect(ChannelPaginationInputSchema.parse({
      page: 2,
      pageSize: 20,
    })).toEqual({
      page: 2,
      pageSize: 20,
    })
  })

  it('infers cursor pagination from next direction only', () => {
    expect(ChannelPaginationInputSchema.parse({
      direction: ChannelPaginationDirection.Next,
    })).toEqual({
      direction: ChannelPaginationDirection.Next,
    })
  })

  it('rejects empty pagination input when the pagination object is explicitly provided', () => {
    expect(() => ChannelPaginationInputSchema.parse({})).toThrow()
  })

  it('defaults optional pagination input to none pagination', () => {
    expect(ChannelPaginationInputWithDefaultSchema.parse(undefined)).toEqual({})
  })

  it('defaults omitted pagination object fields to none pagination', () => {
    const schema = z.object({
      pagination: ChannelPaginationInputWithDefaultSchema,
    })

    expect(schema.parse({})).toEqual({
      pagination: {},
    })
  })
})
