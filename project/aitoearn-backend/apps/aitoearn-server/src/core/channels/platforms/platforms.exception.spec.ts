import type { PlatformSpecificExceptionInput } from './platforms.exception'
import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it } from 'vitest'
import { ChannelPlatformException, PlatformErrorCategory, PlatformErrorCauseType } from './platforms.exception'

class TestPlatformException extends ChannelPlatformException {
  constructor(input: PlatformSpecificExceptionInput) {
    super({ ...input, platform: AccountType.Twitter })
  }
}

describe('channel platform exception', () => {
  it('stores only explicit platform exception context and cause', () => {
    const raw = {
      code: 1002,
      message: 'payload failed',
    }
    const exception = new TestPlatformException({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: PlatformErrorCategory.Unknown,
      context: {
        endpoint: 'POST /platform/test',
        method: 'POST',
        accountId: 'account_1',
      },
      cause: {
        type: PlatformErrorCauseType.Platform,
        httpStatus: 400,
        platformCode: 1002,
        platformMessage: 'payload failed',
        raw,
        quota: {
          usage: 50,
          total: 50,
          durationSeconds: 86400,
          fbtraceId: 'trace-id',
        },
      },
    })

    expect(exception.platform).toBe(AccountType.Twitter)
    expect(exception.context?.endpoint).toBe('POST /platform/test')
    expect(exception.context?.accountId).toBe('account_1')
    expect(exception.platformCause?.httpStatus).toBe(400)
    expect(exception.platformCause?.platformCode).toBe(1002)
    expect(exception.platformCause?.platformMessage).toBe('payload failed')
    expect(exception.platformCause?.raw).toBe(raw)
    expect(exception.toTaskFailure()).toMatchObject({
      message: undefined,
      originalData: {
        platformCode: 1002,
        httpStatus: 400,
        platformMessage: 'payload failed',
        endpoint: 'POST /platform/test',
        method: 'POST',
        raw,
        quota: {
          usage: 50,
          total: 50,
          durationSeconds: 86400,
          fbtraceId: 'trace-id',
        },
      },
    })
  })

  it('does not invent endpoint when context omits it', () => {
    const exception = new TestPlatformException({
      code: ResponseCode.ChannelPlatformApiFailed,
      category: PlatformErrorCategory.Unknown,
    })

    expect(exception.context?.endpoint).toBeUndefined()
    expect(exception.getResponse()).toMatchObject({
      data: expect.not.objectContaining({ endpoint: expect.anything() }),
    })
  })
})
