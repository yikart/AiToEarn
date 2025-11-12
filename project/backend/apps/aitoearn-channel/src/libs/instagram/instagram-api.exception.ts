import { AxiosError } from 'axios'

export interface InstagramRawError {
  message: string
  type: string
  code: number
  error_subcode?: number
  fbtrace_id?: string
  error_user_msg?: string
  error_user_title?: string
}

export interface NormalizedInstagramError {
  status?: number
  raw?: InstagramRawError
  isNetwork: boolean
  isAxios: boolean
  original: unknown
}

export interface InstagramApiExceptionMeta {
  url?: string
  method?: string
  operation?: string
  extra?: Record<string, unknown>
}

export class InstagramApiException extends Error {
  readonly operation: string
  readonly normalized: NormalizedInstagramError
  readonly meta?: InstagramApiExceptionMeta

  constructor(
    operation: string,
    normalized: NormalizedInstagramError,
    meta?: InstagramApiExceptionMeta,
  ) {
    super(InstagramApiException.buildMessage(operation, normalized))
    this.name = 'InstagramApiException'
    this.operation = operation
    this.normalized = normalized
    this.meta = meta
  }

  static buildMessage(op: string, n: NormalizedInstagramError): string {
    if (n.raw) {
      const { message, code, error_subcode, error_user_title } = n.raw
      const sub = error_subcode != null ? `, subcode=${error_subcode}` : ''
      return `${op} failed: ${error_user_title || message} (code=${code}${sub})`
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
      instagram: this.normalized.raw && {
        code: this.normalized.raw.code,
        subcode: this.normalized.raw.error_subcode,
        type: this.normalized.raw.type,
        trace: this.normalized.raw.fbtrace_id,
      },
      meta: this.meta,
    }
  }

  static fromAxiosError(
    operation: string,
    error: AxiosError,
    meta?: InstagramApiExceptionMeta,
  ): InstagramApiException {
    const normalized: NormalizedInstagramError = {
      status: error.response?.status,
      raw: (error.response?.data as { error?: InstagramRawError } | undefined)?.error,
      isNetwork: !!error.isAxiosError && !error.response,
      isAxios: true,
      original: error,
    }
    return new InstagramApiException(operation, normalized, meta)
  }
}

export function normalizeInstagramError(e: unknown): NormalizedInstagramError {
  const err = e as { isAxiosError?: boolean, response?: { status?: number, data?: { error?: InstagramRawError } } }
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
