import type { AccountType } from '@yikart/common'
import type { ChannelPaginationInput, ChannelPaginationMetadata } from './platforms.interface'
import { AppException, ResponseCode } from '@yikart/common'
import { ChannelPaginationDirection, ChannelPaginationMode } from './platforms.interface'

export function normalizeChannelPagination(
  platform: AccountType,
  metadata: ChannelPaginationMetadata,
  pagination: ChannelPaginationInput,
): ChannelPaginationInput {
  const normalized = getDefaultPagination(metadata, pagination)
  const normalizedMode = getPaginationInputMode(normalized)

  if (metadata.mode !== normalizedMode) {
    throw new AppException(ResponseCode.ChannelPaginationModeNotSupported, {
      platform,
      expectedMode: metadata.mode,
      actualMode: normalizedMode,
    })
  }

  switch (normalizedMode) {
    case ChannelPaginationMode.Cursor: {
      const cursorMetadata = metadata as Extract<ChannelPaginationMetadata, { mode: ChannelPaginationMode.Cursor }>
      const limit = normalized.limit ?? cursorMetadata.defaultLimit
      if (limit > cursorMetadata.maxLimit) {
        throw new AppException(ResponseCode.ChannelPaginationLimitExceeded, {
          platform,
          limit,
          maxLimit: cursorMetadata.maxLimit,
        })
      }
      const direction = normalized.direction ?? ChannelPaginationDirection.Next
      if (direction === ChannelPaginationDirection.Previous && !cursorMetadata.supportsPrevious) {
        throw new AppException(ResponseCode.ChannelPaginationDirectionNotSupported, {
          platform,
          direction,
        })
      }
      return { ...normalized, limit, direction }
    }
    case ChannelPaginationMode.Page: {
      const pageMetadata = metadata as Extract<ChannelPaginationMetadata, { mode: ChannelPaginationMode.Page }>
      const pageSize = normalized.pageSize ?? pageMetadata.defaultPageSize
      if (pageSize > pageMetadata.maxPageSize) {
        throw new AppException(ResponseCode.ChannelPaginationPageSizeExceeded, {
          platform,
          pageSize,
          maxPageSize: pageMetadata.maxPageSize,
        })
      }
      return { page: normalized.page ?? 1, pageSize }
    }
  }

  return normalized
}

function getDefaultPagination(
  metadata: ChannelPaginationMetadata,
  pagination: ChannelPaginationInput,
): ChannelPaginationInput {
  if (getPaginationInputMode(pagination) !== ChannelPaginationMode.None || metadata.mode === ChannelPaginationMode.None) {
    return pagination
  }

  switch (metadata.mode) {
    case ChannelPaginationMode.Cursor:
      return {
        limit: metadata.defaultLimit,
        direction: ChannelPaginationDirection.Next,
      }
    case ChannelPaginationMode.Page:
      return {
        page: 1,
        pageSize: metadata.defaultPageSize,
      }
  }

  return pagination
}

function getPaginationInputMode(pagination: ChannelPaginationInput): ChannelPaginationMode {
  if (pagination.page !== undefined || pagination.pageSize !== undefined) {
    return ChannelPaginationMode.Page
  }
  if (pagination.cursor !== undefined || pagination.limit !== undefined || pagination.direction !== undefined) {
    return ChannelPaginationMode.Cursor
  }
  return ChannelPaginationMode.None
}
