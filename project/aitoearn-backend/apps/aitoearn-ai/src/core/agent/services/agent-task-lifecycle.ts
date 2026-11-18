export interface AbortableAgentTask {
  taskId: string
  abortController: AbortController
  claudeCodeProcess?: { kill: () => unknown }
  completionPromise: Promise<void>
  finalStatus: string
}

export function abortAgentTask(task: AbortableAgentTask, status: string): void {
  task.finalStatus = status
  if (!task.abortController.signal.aborted) {
    task.abortController.abort()
  }
  task.claudeCodeProcess?.kill()
}

export async function waitForAgentTasks(
  completionPromises: Promise<void>[],
  timeoutMs: number,
  onTimeout: () => void,
): Promise<void> {
  if (completionPromises.length === 0) {
    return
  }

  let timeoutHandle: NodeJS.Timeout | undefined
  try {
    await Promise.race([
      Promise.all(completionPromises),
      new Promise<void>((resolve) => {
        timeoutHandle = setTimeout(() => {
          onTimeout()
          resolve()
        }, timeoutMs)
      }),
    ])
  }
  finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
  }
}
