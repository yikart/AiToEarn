import type { Redis } from 'ioredis'
import { PluginErrorCode } from '@airongrong/plugin-api'
import { describe, expect, it, vi } from 'vitest'
import { RedisPluginKvStore } from './plugin-host.kv-store.redis'

function createClient(overrides: Record<string, unknown> = {}) {
  return {
    hget: vi.fn(async () => null),
    hdel: vi.fn(async () => 1),
    eval: vi.fn(async () => 1),
    ...overrides,
  } as unknown as Redis
}

describe('redisPluginKvStore', () => {
  it('stores values under the ait:plugin: prefix with JSON envelope', async () => {
    const client = createClient()
    const store = new RedisPluginKvStore(client)

    await store.set('hook.media-spec:account-1', 'cursor', { page: 2 }, 1024)

    const bytes = Buffer.byteLength(JSON.stringify({ page: 2 }))
    expect(client.eval).toHaveBeenCalledWith(
      expect.stringContaining('HSET'),
      1,
      'ait:plugin:hook.media-spec:account-1',
      'cursor',
      JSON.stringify({ v: { page: 2 }, b: bytes }),
      bytes,
      1024,
    )
  })

  it('unwraps the stored value on get', async () => {
    const client = createClient({
      hget: vi.fn(async () => JSON.stringify({ v: { page: 2 }, b: 12 })),
    })
    const store = new RedisPluginKvStore(client)

    await expect(store.get('hook.media-spec:account-1', 'cursor')).resolves.toEqual({ page: 2 })
  })

  it('returns undefined for missing keys', async () => {
    const client = createClient()
    const store = new RedisPluginKvStore(client)

    await expect(store.get('hook.media-spec:account-1', 'missing')).resolves.toBeUndefined()
  })

  it('throws PermissionViolation when the Lua quota check rejects', async () => {
    const client = createClient({ eval: vi.fn(async () => 0) })
    const store = new RedisPluginKvStore(client)

    await expect(store.set('hook.media-spec:account-1', 'big', { data: 'x'.repeat(2048) }, 1024))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
  })

  it('deletes keys via hdel', async () => {
    const client = createClient()
    const store = new RedisPluginKvStore(client)

    await store.delete('hook.media-spec:account-1', 'cursor')

    expect(client.hdel).toHaveBeenCalledWith('ait:plugin:hook.media-spec:account-1', 'cursor')
  })
})
