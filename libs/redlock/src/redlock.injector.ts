import type { Injectable } from '@nestjs/common/interfaces'
import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
import { createHash } from 'node:crypto'
import { Injectable as InjectableDec, Logger, OnModuleInit } from '@nestjs/common'
import { MetadataScanner, ModulesContainer } from '@nestjs/core'
import { RedlockConfig } from './redlock.config'
import {
  REDLOCK_METADATA,
  RedlockOptions,
} from './redlock.decorator'
import { RedlockService } from './redlock.service'

@InjectableDec()
export class RedlockInjector implements OnModuleInit {
  private readonly logger = new Logger(RedlockInjector.name)
  private readonly metadataScanner: MetadataScanner = new MetadataScanner()

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly redlockService: RedlockService,
    private readonly config: RedlockConfig,
  ) {}

  async onModuleInit() {
    for (const provider of this.getProviders()) {
      this.injectToProvider(provider)
    }
  }

  private* getProviders(): Generator<InstanceWrapper<Injectable>> {
    for (const module of this.modulesContainer.values()) {
      for (const provider of module.providers.values()) {
        if (provider && provider.metatype?.prototype) {
          yield provider as InstanceWrapper<Injectable>
        }
      }
    }
  }

  private injectToProvider(wrapper: InstanceWrapper<Injectable>): void {
    const { metatype } = wrapper
    if (!metatype)
      return

    const prototype = metatype.prototype
    const methodNames = this.metadataScanner.getAllMethodNames(prototype)

    for (const methodName of methodNames) {
      const method = prototype[methodName]
      if (this.isDecorated(method)) {
        const options = this.getDecoratorOptions(method)
        const wrappedMethod = this.wrapMethod(method, methodName, prototype.constructor.name, options)
        this.reDecorate(method, wrappedMethod)
        prototype[methodName] = wrappedMethod
        this.logger.log(`Injected distributed lock to ${prototype.constructor.name}.${methodName}`)
      }
    }
  }

  private isDecorated(target: object): boolean {
    return Reflect.hasMetadata(REDLOCK_METADATA, target)
  }

  private getDecoratorOptions(target: object): RedlockOptions {
    return Reflect.getMetadata(REDLOCK_METADATA, target)
  }

  private reDecorate(source: object, destination: object): void {
    const keys = Reflect.getMetadataKeys(source)
    for (const key of keys) {
      const meta = Reflect.getMetadata(key, source)
      Reflect.defineMetadata(key, meta, destination)
    }
  }

  private generateArgsHash(args: unknown[]): string {
    try {
      const argsString = JSON.stringify(args, (key, value) => {
        if (typeof value === 'function') {
          return value.toString()
        }
        if (value && typeof value === 'object' && value.constructor !== Object && value.constructor !== Array) {
          return '[Object]'
        }
        return value
      })
      return createHash('sha256').update(argsString).digest('hex').substring(0, 8)
    }
    catch {
      const fallback = args.map((arg, index) => `${index}:${typeof arg}`).join('-')
      return createHash('sha256').update(fallback).digest('hex').substring(0, 8)
    }
  }

  private wrapMethod(
    originalMethod: (...args: unknown[]) => unknown,
    methodName: string,
    className: string,
    options: RedlockOptions,
  ): (...args: unknown[]) => unknown {
    const lockService = this.redlockService
    const logger = this.logger

    return new Proxy(originalMethod, {
      apply: async (target, thisArg, args: unknown[]) => {
        const baseKey = typeof options.key === 'function' ? options.key(...args) : options.key
        const argsHash = this.generateArgsHash(args)
        const lockKey = `lock:${baseKey}:${argsHash}`
        const lockValue = `${Date.now()}-${Math.random()}`
        const ttl = options.ttl ?? this.config.ttl
        const retryDelay = options.retryDelay ?? this.config.retryDelay
        const retryCount = options.retryCount ?? this.config.retryCount

        let acquired = false
        let attempts = 0

        while (!acquired && attempts < retryCount) {
          acquired = await lockService.acquireLock(lockKey, lockValue, ttl)

          if (!acquired) {
            attempts++
            if (attempts < retryCount) {
              logger.debug(`Failed to acquire lock ${lockKey} for ${className}.${methodName}, attempt ${attempts}/${retryCount}. Retrying in ${retryDelay}ms`)
              await new Promise(resolve => setTimeout(resolve, retryDelay))
            }
          }
        }

        if (!acquired) {
          logger.debug(`Could not acquire lock ${lockKey} for ${className}.${methodName} after ${retryCount} attempts, skipping execution`)
          return
        }

        logger.debug(`Acquired lock ${lockKey} for ${className}.${methodName}, executing method`)

        try {
          const result = Reflect.apply(target, thisArg, args)

          if (result instanceof Promise) {
            return result.finally(async () => {
              await lockService.releaseLock(lockKey, lockValue)
              logger.debug(`Released lock ${lockKey} for ${className}.${methodName}`)
            })
          }

          return result
        }
        finally {
          await lockService.releaseLock(lockKey, lockValue)
          logger.debug(`Released lock ${lockKey} for ${className}.${methodName}`)
        }
      },
    })
  }
}
