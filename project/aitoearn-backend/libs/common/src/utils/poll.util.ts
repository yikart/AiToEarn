export interface PollOptions {
  /** 最大轮询时长（毫秒），默认 15 分钟 */
  maxPollingMs?: number
  /** 轮询间隔（毫秒），默认 10 秒 */
  intervalMs?: number
  /** 任务名称，用于超时错误信息 */
  taskName?: string
}

export interface PollResult<T> {
  /** 是否完成（成功或失败） */
  done: boolean
  /** 完成时的返回数据 */
  data?: T
  /** 失败时的错误信息 */
  error?: string
}

const DEFAULT_POLL_OPTIONS = {
  maxPollingMs: 15 * 60 * 1000,
  intervalMs: 10_000,
  taskName: 'Task',
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
export async function poll<T>(
  pollFn: () => Promise<PollResult<T>>,
  options?: PollOptions,
): Promise<T> {
  const { maxPollingMs, intervalMs, taskName } = { ...DEFAULT_POLL_OPTIONS, ...options }
  const startTime = Date.now()

  while (Date.now() - startTime < maxPollingMs) {
    await new Promise(resolve => setTimeout(resolve, intervalMs))
    const { done, data, error } = await pollFn()

    if (error) {
      throw new Error(`${taskName} failed: ${error}`)
    }
    if (done && data !== undefined) {
      return data
    }
    if (done) {
      throw new Error(`${taskName} completed without data`)
    }
  }

  throw new Error(`${taskName} timed out after ${Math.round(maxPollingMs / 60_000)} minutes`)
}
