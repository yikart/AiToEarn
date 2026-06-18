import { describe, expect, it } from 'vitest'
import {
  ChannelPaginationMetadataVoSchema,
  ChannelPaginationResultVoSchema,
} from './platform-pagination.vo'
import { ChannelPaginationMode } from './platforms.interface'

describe('channel pagination vo schema', () => {
  it('parses cursor pagination metadata and result', () => {
    expect(ChannelPaginationMetadataVoSchema.parse({
      mode: ChannelPaginationMode.Cursor,
      defaultLimit: 10,
      maxLimit: 50,
      supportsPrevious: true,
    })).toEqual({
      mode: ChannelPaginationMode.Cursor,
      defaultLimit: 10,
      maxLimit: 50,
      supportsPrevious: true,
    })

    expect(ChannelPaginationResultVoSchema.parse({
      mode: ChannelPaginationMode.Cursor,
      nextCursor: 'next-1',
      hasNext: true,
      hasPrevious: false,
      limit: 10,
    })).toEqual({
      mode: ChannelPaginationMode.Cursor,
      nextCursor: 'next-1',
      hasNext: true,
      hasPrevious: false,
      limit: 10,
    })
  })

  it('parses page pagination metadata and result', () => {
    expect(ChannelPaginationMetadataVoSchema.parse({
      mode: ChannelPaginationMode.Page,
      defaultPageSize: 10,
      maxPageSize: 100,
      supportsTotal: true,
    })).toEqual({
      mode: ChannelPaginationMode.Page,
      defaultPageSize: 10,
      maxPageSize: 100,
      supportsTotal: true,
    })

    expect(ChannelPaginationResultVoSchema.parse({
      mode: ChannelPaginationMode.Page,
      page: 2,
      pageSize: 10,
      total: 25,
      hasNext: true,
      hasPrevious: true,
    })).toEqual({
      mode: ChannelPaginationMode.Page,
      page: 2,
      pageSize: 10,
      total: 25,
      hasNext: true,
      hasPrevious: true,
    })
  })

  it('parses none pagination metadata and result', () => {
    expect(ChannelPaginationMetadataVoSchema.parse({
      mode: ChannelPaginationMode.None,
    })).toEqual({
      mode: ChannelPaginationMode.None,
    })

    expect(ChannelPaginationResultVoSchema.parse({
      mode: ChannelPaginationMode.None,
    })).toEqual({
      mode: ChannelPaginationMode.None,
    })
  })
})
