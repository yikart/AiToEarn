export type PollErrorMapperData<E = string>
  = | { type: 'failed', taskName: string, error: E }
    | { type: 'completed_without_data', taskName: string }
    | { type: 'timeout', taskName: string, maxPollingMs: number }

export interface PollOptions<E = string> {
  /** 最大轮询时长（毫秒），默认 15 分钟 */
  maxPollingMs?: number
  /** 轮询间隔（毫秒），默认 10 秒 */
  intervalMs?: number
  /** 任务名称，用于超时错误信息 */
  taskName?: string
  /** 映射 poll 自身产生的失败数据 */
  errorMapper?: (data: PollErrorMapperData<E>) => Error
}

export interface PollResult<T, E = string> {
  /** 是否完成（成功或失败） */
  done: boolean
  /** 完成时的返回数据 */
  data?: T
  /** 失败时的原始错误数据 */
  error?: E
}

const DEFAULT_POLL_OPTIONS = {
  maxPollingMs: 15 * 60 * 1000,
  intervalMs: 10_000,
  taskName: 'Task',
}

function defaultPollErrorMapper<E>(data: PollErrorMapperData<E>): Error {
  switch (data.type) {
    case 'failed':
      return new Error(`${data.taskName} failed: ${data.error}`)
    case 'completed_without_data':
      return new Error(`${data.taskName} completed without data`)
    case 'timeout':
      return new Error(`${data.taskName} timed out after ${Math.round(data.maxPollingMs / 60_000)} minutes`)
  }
}

/**
 * 通用轮询工具：按固定间隔调用 pollFn 直到完成或超时
 *
 * @param pollFn - 每次轮询调用的函数，返回 PollResult
 * @param options - 轮询配置
 * @returns 轮询成功后的数据
 *
 * @example
 * const videoUrl = await poll(
 *   async () => {
 *     const result = await videoService.getTask(taskId)
 *     if (result.videoUrl) return { done: true, data: result.videoUrl }
 *     if (result.error) return { done: true, error: result.error }
 *     return { done: false }
 *   },
 *   { maxPollingMs: 10 * 60 * 1000, taskName: 'Video generation' },
 * )
 */
export async function poll<T, E = string>(
  pollFn: () => Promise<PollResult<T, E>>,
  options?: PollOptions<E>,
): Promise<T> {
  const { maxPollingMs, intervalMs, taskName, errorMapper } = { ...DEFAULT_POLL_OPTIONS, ...options }
  const mapError = errorMapper || defaultPollErrorMapper<E>
  const startTime = Date.now()

  while (Date.now() - startTime < maxPollingMs) {
    await new Promise(resolve => setTimeout(resolve, intervalMs))
    const { done, data, error } = await pollFn()

    if (error !== undefined) {
      throw mapError({ type: 'failed', taskName, error })
    }
    if (done && data !== undefined) {
      return data
    }
    if (done) {
      throw mapError({ type: 'completed_without_data', taskName })
    }
  }

  throw mapError({ type: 'timeout', taskName, maxPollingMs })
}
