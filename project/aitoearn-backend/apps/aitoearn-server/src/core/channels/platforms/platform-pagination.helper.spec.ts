import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it } from 'vitest'
import { normalizeChannelPagination } from './platform-pagination.helper'
import { ChannelPaginationDirection, ChannelPaginationMode } from './platforms.interface'

describe('normalizeChannelPagination', () => {
  it('uses cursor metadata defaults when pagination input is empty', () => {
    expect(normalizeChannelPagination(AccountType.Facebook, {
      mode: ChannelPaginationMode.Cursor,
      defaultLimit: 25,
      maxLimit: 100,
      supportsPrevious: true,
    }, {})).toEqual({
      limit: 25,
      direction: ChannelPaginationDirection.Next,
    })
  })

  it('uses page metadata defaults when pagination input is empty', () => {
    expect(normalizeChannelPagination(AccountType.LinkedIn, {
      mode: ChannelPaginationMode.Page,
      defaultPageSize: 10,
      maxPageSize: 100,
      supportsTotal: true,
    }, {})).toEqual({
      page: 1,
      pageSize: 10,
    })
  })

  it('keeps none pagination empty for providers without pagination', () => {
    expect(normalizeChannelPagination(AccountType.YouTube, {
      mode: ChannelPaginationMode.None,
    }, {})).toEqual({})
  })

  it('rejects inputs that do not match provider pagination metadata', () => {
    expect(() => normalizeChannelPagination(AccountType.Facebook, {
      mode: ChannelPaginationMode.Cursor,
      defaultLimit: 25,
      maxLimit: 100,
      supportsPrevious: true,
    }, {
      page: 1,
      pageSize: 10,
    })).toThrow(expect.objectContaining({
      code: ResponseCode.ChannelPaginationModeNotSupported,
    }))
  })
})
