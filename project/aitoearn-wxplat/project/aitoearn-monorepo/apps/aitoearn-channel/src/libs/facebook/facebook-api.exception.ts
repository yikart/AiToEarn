import { AxiosError } from 'axios'

export interface FacebookRawError {
  message: string
  type: string
  code: number
  fbtrace_id: string
}

export interface NormalizedFacebookError {
  status?: number
  raw?: FacebookRawError
  isNetwork: boolean
  isAxios: boolean
  original: unknown
}

export interface FacebookApiExceptionMeta {
  url?: string
  method?: string
  operation?: string
  attempt?: number
  extra?: Record<string, unknown>
}

export class FacebookApiException extends Error {
  readonly operation: string
  readonly normalized: NormalizedFacebookError
  readonly meta?: FacebookApiExceptionMeta

  constructor(
    operation: string,
    normalized: NormalizedFacebookError,
    meta?: FacebookApiExceptionMeta,
  ) {
    super(FacebookApiException.buildMessage(operation, normalized))
    this.name = 'FacebookApiException'
    this.operation = operation
    this.normalized = normalized
    this.meta = meta
  }

  static buildMessage(op: string, n: NormalizedFacebookError): string {
    if (n.raw) {
      const { message, code } = n.raw
      return `${op} failed: ${message} (code=${code})`
    }
    if (n.isNetwork) {
      return `${op} failed: network error`
    }
    return `${op} failed: unexpected error`
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      operation: this.operation,
      status: this.normalized.status,
      facebook: this.normalized.raw && {
        code: this.normalized.raw.code,
        type: this.normalized.raw.type,
        trace: this.normalized.raw.fbtrace_id,
      },
      meta: this.meta,
    }
  }

  static fromAxiosError(
    operation: string,
    error: AxiosError,
    meta?: FacebookApiExceptionMeta,
  ): FacebookApiException {
    const normalized: NormalizedFacebookError = {
      status: error.response?.status,
      raw: (error.response?.data as { error?: FacebookRawError } | undefined)?.error,
      isNetwork: !!error.isAxiosError && !error.response,
      isAxios: true,
      original: error,
    }
    return new FacebookApiException(operation, normalized, meta)
  }
}

export function normalizeFacebookError(e: unknown): NormalizedFacebookError {
  const err = e as { isAxiosError?: boolean, response?: { status?: number, data?: { error?: FacebookRawError } } }
  const isAxios = !!err?.isAxiosError
  const raw = err?.response?.data?.error
  return {
    status: err?.response?.status,
    raw,
    isNetwork: isAxios && !err?.response,
    isAxios,
    original: e,
  }
}
