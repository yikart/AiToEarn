import { getCurrentRequestId } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { createPinoTelemetry } from './pino-telemetry'

const pinoLoggerMocks = vi.hoisted(() => {
  const logger = { child: vi.fn() }
  logger.child.mockReturnValue(logger)
  return { logger }
})

vi.mock('nestjs-pino', () => ({
  PinoLogger: {
    root: pinoLoggerMocks.logger,
  },
}))

describe('pino telemetry context manager', () => {
  it('restores propagation request id inside queue job context', () => {
    const contextManager = createPinoTelemetry().contextManager

    contextManager.with({ requestId: 'req-1' }, () => {
      expect(getCurrentRequestId()).toBe('req-1')
      expect(contextManager.active()).toEqual({ requestId: 'req-1' })
    })

    expect(getCurrentRequestId()).toBeUndefined()
  })
})
