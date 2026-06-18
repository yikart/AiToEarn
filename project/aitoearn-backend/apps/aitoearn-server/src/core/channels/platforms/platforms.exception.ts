import type { AccountType, ResponseCode } from '@yikart/common'
import { AppException } from '@yikart/common'

export enum PlatformErrorCategory {
  Auth = 'auth',
  Permission = 'permission',
  RateLimit = 'rate_limit',
  Quota = 'quota',
  Validation = 'validation',
  MediaUnavailable = 'media_unavailable',
  MediaProcessingFailed = 'media_processing_failed',
  NotFound = 'not_found',
  Conflict = 'conflict',
  PlatformUnavailable = 'platform_unavailable',
  Timeout = 'timeout',
  Network = 'network',
  WebhookInvalid = 'webhook_invalid',
  SdkError = 'sdk_error',
  Unknown = 'unknown',
}

export enum PlatformErrorCauseType {
  Http = 'http',
  Network = 'network',
  Platform = 'platform',
  Validation = 'validation',
  SdkError = 'sdk_error',
  Unknown = 'unknown',
}

export interface ChannelPlatformErrorContext {
  accountId?: string
  taskId?: string
  platformWorkId?: string
  endpoint?: string
  method?: string
  metadata?: Record<string, unknown>
}

export interface ChannelPlatformErrorCause {
  type: PlatformErrorCauseType
  httpStatus?: number
  platformCode?: string | number
  platformMessage?: string
  raw?: unknown
  quota?: {
    usage?: number
    total?: number
    durationSeconds?: number
    fbtraceId?: string
  }
}

export interface ChannelPlatformExceptionInput {
  code: ResponseCode
  platform: AccountType
  category: PlatformErrorCategory
  context?: ChannelPlatformErrorContext
  cause?: ChannelPlatformErrorCause
  retryable?: boolean
}

export type PlatformSpecificExceptionInput = Omit<ChannelPlatformExceptionInput, 'platform'>

export interface PlatformValidationExceptionInput {
  code: ResponseCode
  category: PlatformErrorCategory
  context?: ChannelPlatformErrorContext
  cause?: Omit<ChannelPlatformErrorCause, 'type'>
}

export class ChannelPlatformException extends AppException {
  readonly platform: AccountType
  readonly category: PlatformErrorCategory
  readonly context?: ChannelPlatformErrorContext
  readonly platformCause?: ChannelPlatformErrorCause
  readonly retryable: boolean

  constructor(input: ChannelPlatformExceptionInput) {
    super(input.code, ChannelPlatformException.toPublicData(input))
    this.name = new.target.name
    this.platform = input.platform
    this.category = input.category
    this.context = input.context
    this.platformCause = input.cause
    this.retryable = input.retryable ?? false
  }

  static toPublicData(input: ChannelPlatformExceptionInput): Record<string, unknown> {
    return {
      platform: input.platform,
      category: input.category,
      retryable: input.retryable ?? false,
      accountId: input.context?.accountId,
      taskId: input.context?.taskId,
      platformWorkId: input.context?.platformWorkId,
      endpoint: input.context?.endpoint,
      httpStatus: input.cause?.httpStatus,
      platformCode: input.cause?.platformCode,
    }
  }

  toTaskFailure(): {
    category: PlatformErrorCategory
    code: string
    message: string | undefined
    retryable: boolean
    originalData?: unknown
  } {
    return {
      category: this.category,
      code: String(this.code),
      message: undefined,
      retryable: this.retryable,
      originalData: {
        platformCode: this.platformCause?.platformCode,
        httpStatus: this.platformCause?.httpStatus,
        platformMessage: this.platformCause?.platformMessage,
        endpoint: this.context?.endpoint,
        method: this.context?.method,
        raw: this.platformCause?.raw,
        quota: this.platformCause?.quota,
      },
    }
  }
}
