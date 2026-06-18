import { describe, expect, it, vi } from 'vitest'
import { PublishQueueService } from './publish-queue.service'

function createService() {
  type ServiceDeps = ConstructorParameters<typeof PublishQueueService>
  const queueService = {
    addPostPublishJob: vi.fn(),
    getPostPublishJob: vi.fn(),
    addPostMediaTaskJob: vi.fn(),
    addUpdatePublishedPostJob: vi.fn(),
  }
  const service = new PublishQueueService(queueService as unknown as ServiceDeps[0])

  return { service, queueService }
}

describe('publishQueueService', () => {
  it('uses BullMQ-compatible custom job ids', async () => {
    const { service, queueService } = createService()

    await service.enqueueImmediate('task_1')
    await service.enqueueDelayed('task_2', 1000)
    await service.removeJob('task_1')
    await service.enqueueMediaFinalize('task_3', 2000, 2)
    await service.enqueueUpdate('task_4')

    expect(queueService.addPostPublishJob).toHaveBeenNthCalledWith(1, expect.objectContaining({
      jobId: 'publish-task_1',
    }), expect.objectContaining({
      jobId: 'publish-task_1',
    }))
    expect(queueService.addPostPublishJob).toHaveBeenNthCalledWith(2, expect.objectContaining({
      jobId: 'publish-task_2',
    }), expect.objectContaining({
      jobId: 'publish-task_2',
    }))
    expect(queueService.getPostPublishJob).toHaveBeenCalledWith('publish-task_1')
    expect(queueService.getPostPublishJob).toHaveBeenCalledWith('publish-task_1-1')
    expect(queueService.getPostPublishJob).toHaveBeenCalledWith('publish-task_1-2')
    expect(queueService.addPostMediaTaskJob).toHaveBeenCalledWith(expect.objectContaining({
      jobId: 'media-finalize-task_3-2',
    }), expect.objectContaining({
      jobId: 'media-finalize-task_3-2',
    }))
    expect(queueService.addUpdatePublishedPostJob).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      jobId: 'publish-update-task_4',
    }))
  })
})
