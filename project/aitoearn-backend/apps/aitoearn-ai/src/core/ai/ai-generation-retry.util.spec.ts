import { BadRequestException } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { AxiosError } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { isNonRetryableAiRequestError, runWithAiGenerationRetry } from './ai-generation-retry.util'

describe('ai generation retry util', () => {
  it('treats request errors as non-retryable', () => {
    expect(isNonRetryableAiRequestError(new AppException(ResponseCode.InvalidModel))).toBe(true)
    expect(isNonRetryableAiRequestError(new BadRequestException('image size is not supported'))).toBe(true)
  })

  it('keeps content safety errors retryable', () => {
    expect(isNonRetryableAiRequestError(new BadRequestException('content policy violation'))).toBe(false)
    expect(isNonRetryableAiRequestError(new Error('内容安全拦截'))).toBe(false)
    expect(isNonRetryableAiRequestError(new Error('风控失败'))).toBe(false)
  })

  it('keeps provider and transport failures retryable by default', () => {
    const rateLimitError = new AxiosError('rate limited')
    rateLimitError.response = { status: 429 } as never

    const upstreamError = new AxiosError('upstream failed')
    upstreamError.response = { status: 500 } as never

    expect(isNonRetryableAiRequestError(rateLimitError)).toBe(false)
    expect(isNonRetryableAiRequestError(upstreamError)).toBe(false)
    expect(isNonRetryableAiRequestError(new Error('socket timeout'))).toBe(false)
  })

  it('uses retry as extra attempts', async () => {
    const run = vi.fn()
      .mockRejectedValueOnce(new Error('upstream failed'))
      .mockResolvedValue('ok')

    await expect(runWithAiGenerationRetry(run, 1)).resolves.toBe('ok')
    expect(run).toHaveBeenCalledTimes(2)
  })

  it('does not retry non-retryable errors', async () => {
    const run = vi.fn().mockRejectedValue(new AppException(ResponseCode.InvalidModel))

    await expect(runWithAiGenerationRetry(run, 1)).rejects.toMatchObject({ code: ResponseCode.InvalidModel })
    expect(run).toHaveBeenCalledTimes(1)
  })
})
