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

  it('treats content safety errors as non-retryable', () => {
    expect(isNonRetryableAiRequestError(new BadRequestException('content policy violation'))).toBe(true)
    expect(isNonRetryableAiRequestError(new Error('内容安全拦截'))).toBe(true)
    expect(isNonRetryableAiRequestError(new Error('风控失败'))).toBe(true)
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

  it('uses retry as extra attempts with exponential backoff and jitter', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const run = vi.fn()
      .mockRejectedValueOnce(new Error('upstream failed'))
      .mockResolvedValue('ok')

    try {
      const result = runWithAiGenerationRetry(run, 1)
      await vi.waitFor(() => expect(run).toHaveBeenCalledTimes(1))
      await vi.advanceTimersByTimeAsync(749)
      expect(run).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)
      await expect(result).resolves.toBe('ok')
      expect(run).toHaveBeenCalledTimes(2)
    }
    finally {
      vi.restoreAllMocks()
      vi.useRealTimers()
    }
  })

  it('does not retry non-retryable errors', async () => {
    const error = new AppException(ResponseCode.InvalidModel)
    const run = vi.fn().mockRejectedValue(error)

    await expect(runWithAiGenerationRetry(run, 1)).rejects.toBe(error)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('does not retry content safety rejections', async () => {
    const error = new BadRequestException('content policy violation')
    const run = vi.fn().mockRejectedValue(error)

    await expect(runWithAiGenerationRetry(run, 3)).rejects.toBe(error)
    expect(run).toHaveBeenCalledTimes(1)
  })
})
