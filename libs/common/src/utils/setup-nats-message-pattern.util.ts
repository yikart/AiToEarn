import type { MetadataScanner, ModulesContainer } from '@nestjs/core'
import { PATTERN_HANDLER_METADATA, PATTERN_METADATA, TRANSPORT_METADATA } from '@nestjs/microservices/constants'
import { PatternHandler } from '@nestjs/microservices/enums/pattern-handler.enum'
import { Transport } from '@nestjs/microservices/enums/transport.enum'

export function setupNatsMessagePattern(
  container: ModulesContainer,
  metadataScanner: MetadataScanner,
  prefix?: string,
) {
  if (!prefix) {
    return
  }

  for (const module of container.values()) {
    for (const controller of module.controllers.values()) {
      const instance = controller.instance
      if (!instance)
        continue

      const instancePrototype = Object.getPrototypeOf(instance)
      const methodNames = metadataScanner.getAllMethodNames(instancePrototype)

      for (const methodName of methodNames) {
        const method = instancePrototype[methodName]
        if (!method)
          continue

        const patterns = Reflect.getMetadata(PATTERN_METADATA, method)
        const handlerType = Reflect.getMetadata(PATTERN_HANDLER_METADATA, method)
        const transport = Reflect.getMetadata(TRANSPORT_METADATA, method)

        if (
          patterns
          && Array.isArray(patterns)
          && handlerType === PatternHandler.MESSAGE
          && transport === Transport.NATS
        ) {
          const prefixedPatterns = patterns.map((pattern) => {
            if (typeof pattern === 'string') {
              return `${prefix}.${pattern}`
            }
            return pattern
          })

          Reflect.defineMetadata(PATTERN_METADATA, prefixedPatterns, method)
        }
      }
    }
  }
}
