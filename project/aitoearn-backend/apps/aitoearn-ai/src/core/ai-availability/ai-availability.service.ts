import { Injectable } from '@nestjs/common'

export interface AiAvailabilityContext {
  provider: string
  operation: string
  model?: string
  module?: string
  sourceApp?: string
  metadata?: Record<string, unknown>
}

@Injectable()
export class AiAvailabilityService {
  async execute<T>(
    _context: AiAvailabilityContext,
    executor: () => Promise<T>,
  ): Promise<T> {
    return executor()
  }

  async executeAsync<T>(
    _context: AiAvailabilityContext,
    executor: () => Promise<T>,
    _extractTaskId: (result: T) => string,
  ): Promise<T> {
    return executor()
  }

  async recordSuccess(_context: AiAvailabilityContext, _latencyMs?: number): Promise<void> {}

  async recordFailure(_context: AiAvailabilityContext, _error: unknown, _latencyMs?: number): Promise<void> {}

  async recordAsyncComplete(
    _asyncTaskId: string,
    _context: AiAvailabilityContext,
    _params: { success: boolean, latencyMs?: number, errorMessage?: string, isBusinessError?: boolean },
  ): Promise<void> {}
}
