import type { Injectable } from '@nestjs/common/interfaces'
import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
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
        const lockKey = `lock:${baseKey}`
        const lockValue = `${Date.now()}-${Math.random()}`
        const ttl = options.ttl ?? this.config.ttl
        const retryDelay = options.retryDelay ?? this.config.retryDelay
        const retryCount = options.retryCount ?? this.config.retryCount
        const throwOnFailure = options.throwOnFailure ?? true

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
          const message = `Could not acquire lock ${lockKey} for ${className}.${methodName} after ${retryCount} attempts`
          if (throwOnFailure) {
            logger.error(message)
            throw new Error(message)
          }
          else {
            logger.debug(`${message}, skipping execution`)
            return
          }
        }

        logger.debug(`Acquired lock ${lockKey} for ${className}.${methodName}, executing method`)

        const result = (async () => Reflect.apply(target, thisArg, args))()
        return result.finally(async () => {
          await lockService.releaseLock(lockKey, lockValue)
          logger.debug(`Released lock ${lockKey} for ${className}.${methodName}`)
        })
      },
    })
  }
}
