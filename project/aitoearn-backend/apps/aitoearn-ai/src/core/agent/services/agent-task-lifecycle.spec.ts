import { afterEach, describe, expect, it, vi } from 'vitest'
import { AbortableAgentTask, abortAgentTask, waitForAgentTasks } from './agent-task-lifecycle'

describe('agent task lifecycle helpers', () => {
  afterEach(() => vi.useRealTimers())

  it('sets terminal status, aborts the controller, and kills the child process', () => {
    const abortController = new AbortController()
    const kill = vi.fn()
    const task: AbortableAgentTask = {
      taskId: 'task-1',
      abortController,
      claudeCodeProcess: { kill },
      completionPromise: Promise.resolve(),
      finalStatus: 'aborted',
    }

    abortAgentTask(task, 'error')

    expect(task.finalStatus).toBe('error')
    expect(abortController.signal.aborted).toBe(true)
    expect(kill).toHaveBeenCalledOnce()
  })

  it('bounds shutdown waiting when completion never resolves', async () => {
    vi.useFakeTimers()
    const onTimeout = vi.fn()
    let settled = false
    const waiting = waitForAgentTasks([new Promise<void>(() => {})], 100, onTimeout).then(() => {
      settled = true
    })

    await vi.advanceTimersByTimeAsync(100)
    await waiting

    expect(settled).toBe(true)
    expect(onTimeout).toHaveBeenCalledOnce()
  })
})
