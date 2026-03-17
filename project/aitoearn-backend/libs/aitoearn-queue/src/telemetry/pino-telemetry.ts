import type { ContextManager, Span, SpanOptions, Telemetry, Tracer } from 'bullmq'
import { propagationContext } from '@yikart/common'
import { PinoLogger } from 'nestjs-pino'
import { storage, Store } from 'nestjs-pino/storage'

interface PinoTelemetryContext {
  requestId?: string
}

class NoopSpan implements Span<PinoTelemetryContext> {
  setSpanOnContext(ctx: PinoTelemetryContext): PinoTelemetryContext {
    return ctx
  }

  setAttribute(): void {}
  setAttributes(): void {}
  addEvent(): void {}
  recordException(): void {}
  end(): void {}
}

class PinoTracer implements Tracer<PinoTelemetryContext> {
  startSpan(
    _name: string,
    _options?: SpanOptions,
    _context?: PinoTelemetryContext,
  ): Span<PinoTelemetryContext> {
    return new NoopSpan()
  }
}

class PinoContextManager implements ContextManager<PinoTelemetryContext> {
  with<A extends (...args: unknown[]) => unknown>(
    context: PinoTelemetryContext,
    fn: A,
  ): ReturnType<A> {
    const bindings: Record<string, unknown> = {}
    if (context.requestId) {
      bindings['requestId'] = context.requestId
    }

    const logger = PinoLogger.root.child(bindings)
    const store = new Store(logger)
    return storage.run(store, fn) as ReturnType<A>
  }

  active(): PinoTelemetryContext {
    const store = propagationContext.getStore()
    const requestId = store?.headers?.['x-request-id']
    return {
      requestId: typeof requestId === 'string' ? requestId : undefined,
    }
  }

  getMetadata(context: PinoTelemetryContext): string {
    return JSON.stringify(context)
  }

  fromMetadata(
    activeContext: PinoTelemetryContext,
    metadata: string,
  ): PinoTelemetryContext {
    try {
      const parsed = JSON.parse(metadata) as PinoTelemetryContext
      return { ...activeContext, ...parsed }
    }
    catch {
      return activeContext
    }
  }
}

export function createPinoTelemetry(): Telemetry<PinoTelemetryContext> {
  return {
    tracer: new PinoTracer(),
    contextManager: new PinoContextManager(),
  }
}
