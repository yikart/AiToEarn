import { customAlphabet } from 'nanoid'
import { PinoLogger } from 'nestjs-pino'
import { storage, Store } from 'nestjs-pino/storage'

const idGenerator = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 21)

export function WithLoggerContext(
  extraFields?: Record<string, unknown>,
): MethodDecorator {
  return (_target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => unknown

    descriptor.value = function (...args: unknown[]): unknown {
      const bindings: Record<string, unknown> = {
        executionId: idGenerator(),
        method: propertyKey,
        ...extraFields,
      }

      const logger = PinoLogger.root.child(bindings)
      const store = new Store(logger)
      return storage.run(store, () => original.apply(this, args))
    }

    return descriptor
  }
}
