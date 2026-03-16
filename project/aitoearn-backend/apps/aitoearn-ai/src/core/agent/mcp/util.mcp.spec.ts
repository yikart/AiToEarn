import { Logger } from '@nestjs/common'
import { ContentGenerationTaskRepository } from '@yikart/mongodb'
import { vi } from 'vitest'
import { UtilMcp, UtilToolName } from './util.mcp'

describe('utilMcp', () => {
  let utilMcp: UtilMcp
  let mockLogger: Logger
  let mockContentGenerateRepository: vi.Mocked<ContentGenerationTaskRepository>

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    } as unknown as Logger

    mockContentGenerateRepository = {
      updateById: vi.fn().mockResolvedValue(undefined),
    } as unknown as vi.Mocked<ContentGenerationTaskRepository>

    utilMcp = new UtilMcp(mockContentGenerateRepository)
    // Override the logger for testing
    Object.defineProperty(utilMcp, 'logger', { value: mockLogger })
  })

  describe('getCurrentTime', () => {
    it('should return current time in ISO 8601 format', async () => {
      const result = await utilMcp.getCurrentTime.handler({}, {})

      expect(result.isError).toBeUndefined()
      expect(result.content).toBeDefined()
      expect(result.content[0]).toHaveProperty('type', 'text')

      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toContain('Current time:')
      expect(textContent.text).toContain('ISO 8601:')
      // Verify it contains a valid ISO date format
      expect(textContent.text).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should have correct tool name', () => {
      expect(utilMcp.getCurrentTime.name).toBe(UtilToolName.GetCurrentTime)
    })
  })

  describe('wait', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should wait for specified seconds', async () => {
      const waitPromise = utilMcp.wait.handler({ seconds: 5 }, {})

      // Fast-forward time
      vi.advanceTimersByTime(5000)

      const result = await waitPromise

      expect(result.isError).toBeUndefined()
      expect(result.content).toBeDefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toBe('Waited for 5 seconds')
    })

    it('should have correct tool name', () => {
      expect(utilMcp.wait.name).toBe(UtilToolName.Wait)
    })

    it('should have correct description', () => {
      expect(utilMcp.wait.description).toContain('Wait for a specified number of seconds')
    })
  })

  describe('createSetTitleTool', () => {
    const taskId = 'test-task-id'

    it('should update title in repository', async () => {
      const [setTitleTool, , cleanup] = utilMcp.createSetTitleTool(taskId)

      const result = await setTitleTool.handler({ title: 'New Title' }, {})

      expect(mockContentGenerateRepository.updateById).toHaveBeenCalledWith(taskId, {
        title: 'New Title',
      })
      expect(result.isError).toBeUndefined()
      const textContent = result.content[0] as { type: 'text', text: string }
      expect(textContent.text).toBe('Title updated successfully')

      cleanup()
    })

    it('should emit title update event via Subject', async () => {
      const [setTitleTool, titleObservable, cleanup] = utilMcp.createSetTitleTool(taskId)

      const emittedEvents: unknown[] = []
      const subscription = titleObservable.subscribe(event => emittedEvents.push(event))

      await setTitleTool.handler({ title: 'Test Title' }, {})

      expect(emittedEvents).toHaveLength(1)
      expect(emittedEvents[0]).toMatchObject({
        taskId,
        title: 'Test Title',
      })

      subscription.unsubscribe()
      cleanup()
    })

    it('should have correct tool name', () => {
      const [setTitleTool, , cleanup] = utilMcp.createSetTitleTool(taskId)

      expect(setTitleTool.name).toBe(UtilToolName.SetTitle)

      cleanup()
    })

    it('should complete subject on cleanup', () => {
      const [, titleObservable, cleanup] = utilMcp.createSetTitleTool(taskId)

      let completed = false
      titleObservable.subscribe({
        complete: () => {
          completed = true
        },
      })

      cleanup()

      expect(completed).toBe(true)
    })
  })

  describe('server', () => {
    it('should create server with correct name', () => {
      expect(utilMcp.server).toBeDefined()
      expect(utilMcp.server.name).toBe('util')
    })

    it('should include wait and getCurrentTime tools', () => {
      const server = utilMcp.server as { tools?: Array<{ name: string }> }
      const tools = server.tools
      expect(tools).toBeDefined()
      expect(tools?.length).toBeGreaterThanOrEqual(2)

      const toolNames = tools?.map(t => t.name)
      expect(toolNames).toContain(UtilToolName.Wait)
      expect(toolNames).toContain(UtilToolName.GetCurrentTime)
    })
  })
})
