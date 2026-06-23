import { describe, expect, it, vi } from 'vitest'
import { poll } from './poll.util'

async function runWithTimers<T>(operation: () => Promise<T>): Promise<T> {
  vi.useFakeTimers()
  try {
    const result = operation()
      .then(value => ({ value }))
      .catch((error: unknown) => ({ error }))
    await vi.runAllTimersAsync()
    const settled = await result
    if ('error' in settled) {
      throw settled.error
    }
    return settled.value
  }
  finally {
    vi.useRealTimers()
  }
}

describe('poll', () => {
  it('maps timeout errors when errorMapper is provided', async () => {
    const mappedError = new Error('mapped timeout')
    const mapperInputs: unknown[] = []

    await expect(runWithTimers(() => poll(
      async () => ({ done: false }),
      {
        intervalMs: 1000,
        maxPollingMs: 1000,
        taskName: 'Media processing',
        errorMapper: (data) => {
          mapperInputs.push(data)
          return mappedError
        },
      },
    ))).rejects.toBe(mappedError)
    expect(mapperInputs).toEqual([{
      type: 'timeout',
      taskName: 'Media processing',
      maxPollingMs: 1000,
    }])
  })

  it('maps result errors with the original error data when errorMapper is provided', async () => {
    const mappedError = new Error('mapped failure')
    const mapperInputs: unknown[] = []
    const platformError = { code: 'platform_error', raw: { id: 'error-id' } }

    await expect(runWithTimers(() => poll<string, typeof platformError>(
      async () => ({ done: true, error: platformError }),
      {
        intervalMs: 1000,
        maxPollingMs: 10_000,
        taskName: 'Media processing',
        errorMapper: (data) => {
          mapperInputs.push(data)
          return mappedError
        },
      },
    ))).rejects.toBe(mappedError)
    expect(mapperInputs).toEqual([{
      type: 'failed',
      taskName: 'Media processing',
      error: platformError,
    }])
  })

  it('maps completed without data when errorMapper is provided', async () => {
    const mappedError = new Error('mapped missing data')
    const mapperInputs: unknown[] = []

    await expect(runWithTimers(() => poll(
      async () => ({ done: true }),
      {
        intervalMs: 1000,
        maxPollingMs: 10_000,
        taskName: 'Media processing',
        errorMapper: (data) => {
          mapperInputs.push(data)
          return mappedError
        },
      },
    ))).rejects.toBe(mappedError)
    expect(mapperInputs).toEqual([{
      type: 'completed_without_data',
      taskName: 'Media processing',
    }])
  })

  it('does not map errors thrown by pollFn', async () => {
    const thrownError = new Error('platform exception')
    const errorMapper = vi.fn(() => new Error('mapped error'))

    await expect(runWithTimers(() => poll(
      async () => {
        throw thrownError
      },
      {
        intervalMs: 1000,
        maxPollingMs: 10_000,
        taskName: 'Media processing',
        errorMapper,
      },
    ))).rejects.toBe(thrownError)
    expect(errorMapper).not.toHaveBeenCalled()
  })

  it('keeps default failed errors when no errorMapper is provided', async () => {
    await expect(runWithTimers(() => poll(
      async () => ({ done: true, error: 'failed by platform' }),
      {
        intervalMs: 1000,
        maxPollingMs: 10_000,
        taskName: 'Media processing',
      },
    ))).rejects.toThrow('Media processing failed: failed by platform')
  })

  it('keeps default completed-without-data errors when no errorMapper is provided', async () => {
    await expect(runWithTimers(() => poll(
      async () => ({ done: true }),
      {
        intervalMs: 1000,
        maxPollingMs: 10_000,
        taskName: 'Media processing',
      },
    ))).rejects.toThrow('Media processing completed without data')
  })

  it('keeps default timeout errors when no errorMapper is provided', async () => {
    await expect(runWithTimers(() => poll(
      async () => ({ done: false }),
      {
        intervalMs: 1000,
        maxPollingMs: 1000,
        taskName: 'Media processing',
      },
    ))).rejects.toThrow('Media processing timed out after 0 minutes')
  })

  it('does not drop falsy result error data', async () => {
    const mapperInputs: unknown[] = []
    const mappedError = new Error('mapped falsy failure')

    await expect(runWithTimers(() => poll<string, number>(
      async () => ({ done: true, error: 0 }),
      {
        intervalMs: 1000,
        maxPollingMs: 10_000,
        taskName: 'Media processing',
        errorMapper: (data) => {
          mapperInputs.push(data)
          return mappedError
        },
      },
    ))).rejects.toBe(mappedError)
    expect(mapperInputs).toEqual([{
      type: 'failed',
      taskName: 'Media processing',
      error: 0,
    }])
  })
})
