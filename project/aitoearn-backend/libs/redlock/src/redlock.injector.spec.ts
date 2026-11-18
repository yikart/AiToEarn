import type { ModulesContainer } from '@nestjs/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Redlock } from './redlock.decorator'
import { RedlockInjector } from './redlock.injector'

function createContainer(providers: object[], moduleCount = 1): ModulesContainer {
  const modules = new Map()
  for (let i = 0; i < moduleCount; i++) {
    const providerMap = new Map()
    for (const [index, provider] of providers.entries()) {
      providerMap.set(`${index}`, { metatype: provider.constructor, instance: provider })
    }
    modules.set(`module-${i}`, { providers: providerMap, controllers: new Map() })
  }
  return modules as unknown as ModulesContainer
}

function createLockService(renewResult = true) {
  return {
    acquireLock: vi.fn().mockResolvedValue(true),
    releaseLock: vi.fn().mockResolvedValue(true),
    renewLock: vi.fn().mockResolvedValue(renewResult),
  }
}

async function createInjector(providers: object[], lockService: object, moduleCount = 1) {
  const injector = new RedlockInjector(
    createContainer(providers, moduleCount),
    lockService as never,
    { ttl: 3, retryDelay: 0, retryCount: 1 } as never,
  )
  await injector.onModuleInit()
}

describe('redlockInjector', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('wraps a decorated method once even when the provider is scanned twice', async () => {
    class Handler {
      @Redlock('handler-key', 3)
      async run() {
        return 'done'
      }
    }
    const instance = new Handler()
    const lockService = createLockService()

    await createInjector([instance], lockService, 2)

    await expect(instance.run()).resolves.toBe('done')
    expect(lockService.acquireLock).toHaveBeenCalledTimes(1)
    expect(lockService.releaseLock).toHaveBeenCalledTimes(1)
  })

  it('renews the lock while the critical section outlives the ttl', async () => {
    vi.useFakeTimers()
    const lockService = createLockService()

    class SlowHandler {
      @Redlock('slow-key', 3)
      async run() {
        await new Promise(resolve => setTimeout(resolve, 9000))
        return 'done'
      }
    }
    const instance = new SlowHandler()

    await createInjector([instance], lockService)
    const result = instance.run()

    await vi.advanceTimersByTimeAsync(3000)
    expect(lockService.renewLock).toHaveBeenCalledWith('lock:slow-key', expect.any(String), 3)

    await vi.advanceTimersByTimeAsync(7000)
    await expect(result).resolves.toBe('done')
    expect(lockService.releaseLock).toHaveBeenCalledTimes(1)
  })

  it('stops renewing once the lock is lost', async () => {
    vi.useFakeTimers()
    const lockService = createLockService(false)

    class LostLockHandler {
      @Redlock('lost-key', 3)
      async run() {
        await new Promise(resolve => setTimeout(resolve, 9000))
        return 'done'
      }
    }
    const instance = new LostLockHandler()

    await createInjector([instance], lockService)
    const result = instance.run()

    await vi.advanceTimersByTimeAsync(3000)
    await vi.advanceTimersByTimeAsync(7000)
    await result

    expect(lockService.renewLock).toHaveBeenCalledTimes(1)
  })
})
