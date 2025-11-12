import { AxiosError } from 'axios'

export interface PinterestRawError {
  // Pinterest error payload shape may vary by endpoint; keep flexible
  // Docs: https://developers.pinterest.com/docs/api/v5/
  message?: string
  code?: number | string
  type?: string
  status?: number
}

export interface NormalizedPinterestError {
  status?: number
  raw?: unknown
  isNetwork: boolean
  isAxios: boolean
  original: unknown
}

export interface PinterestApiExceptionMeta {
  url?: string
  method?: string
  operation?: string
  attempt?: number
  extra?: Record<string, unknown>
}

export class PinterestApiException extends Error {
  readonly operation: string
  readonly normalized: NormalizedPinterestError
  readonly meta?: PinterestApiExceptionMeta

  constructor(
    operation: string,
    normalized: NormalizedPinterestError,
    meta?: PinterestApiExceptionMeta,
  ) {
    super(PinterestApiException.buildMessage(operation, normalized))
    this.name = 'PinterestApiException'
    this.operation = operation
    this.normalized = normalized
    this.meta = meta
  }

  static buildMessage(op: string, n: NormalizedPinterestError): string {
    // Attempt to derive message from common Pinterest error shapes
    const raw = n.raw as { message?: string, code?: number | string } | undefined
    if (raw?.message) {
      return `${op} failed: ${raw.message}${raw.code ? ` (code=${raw.code})` : ''}`
    }
    if (n.isNetwork)
      return `${op} failed: network error`
    return `${op} failed: unexpected error`
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      operation: this.operation,
      status: this.normalized.status,
      meta: this.meta,
    }
  }

  static fromAxiosError(
    operation: string,
    error: AxiosError,
    meta?: PinterestApiExceptionMeta,
  ): PinterestApiException {
    const normalized: NormalizedPinterestError = {
      status: error.response?.status,
      raw: error.response?.data,
      isNetwork: !!error.isAxiosError && !error.response,
      isAxios: true,
      original: error,
    }
    return new PinterestApiException(operation, normalized, meta)
  }
}

export function normalizePinterestError(e: unknown): NormalizedPinterestError {
  const err = e as { isAxiosError?: boolean, response?: { status?: number, data?: unknown } }
  const isAxios = !!err?.isAxiosError
  return {
    status: err?.response?.status,
    raw: err?.response?.data,
    isNetwork: isAxios && !err?.response,
    isAxios,
    original: e,
  }
}
