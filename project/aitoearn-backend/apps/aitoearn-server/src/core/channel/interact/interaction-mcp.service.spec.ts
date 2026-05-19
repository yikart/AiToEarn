import { ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { InteractionMcpService } from './interaction-mcp.service'

function createService() {
  const interactionRecordService = {
    create: vi.fn(),
    getById: vi.fn(),
    getList: vi.fn(),
    delete: vi.fn(),
  }

  const service = new InteractionMcpService(interactionRecordService as any)

  return {
    service,
    interactionRecordService,
  }
}

describe('interactionMcpService', () => {
  it('删除互动记录时校验归属用户', async () => {
    const { service, interactionRecordService } = createService()

    interactionRecordService.getById.mockResolvedValue({
      id: 'record-1',
      userId: 'other-user',
    })

    await expect(service.deleteInteractionRecord('user-1', { id: 'record-1' })).rejects.toMatchObject({
      code: ResponseCode.InteractRecordNotFound,
    })

    expect(interactionRecordService.delete).not.toHaveBeenCalled()
  })
})
