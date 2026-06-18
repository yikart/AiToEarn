import { describe, expect, it, vi } from 'vitest'

import { PublishTaskController } from './publish-task.controller'

vi.mock('@yikart/aitoearn-auth', () => ({
  GetToken: () => () => undefined,
  TokenInfo: class TokenInfo {},
}))

vi.mock('./publish-task.service', () => ({
  PublishTaskService: class PublishTaskService {},
}))

describe('publish task controller', () => {
  it('retries publish tasks for the current user', async () => {
    const publishTaskService = {
      retryTask: vi.fn(async () => undefined),
    }
    const controller = new PublishTaskController(publishTaskService as never)

    await expect(controller.retryTask({ id: 'user-1' } as never, 'task-1')).resolves.toEqual({
      taskId: 'task-1',
    })

    expect(publishTaskService.retryTask).toHaveBeenCalledWith('user-1', 'task-1')
  })
})
