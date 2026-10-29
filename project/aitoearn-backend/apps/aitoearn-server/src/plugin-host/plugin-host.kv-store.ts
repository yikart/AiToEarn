import { PluginError, PluginErrorCode } from '@airongrong/plugin-api'

export interface PluginKvStore {
  get: (scope: string, key: string) => Promise<unknown>
  set: (scope: string, key: string, value: unknown, quotaBytes: number) => Promise<void>
  delete: (scope: string, key: string) => Promise<void>
}

interface ScopedEntry {
  value: unknown
  bytes: number
}

/**
 * 进程内 KV 实现。多实例部署请改用 RedisPluginKvStore（plugin-host.kv-store.redis），
 * 分区键保持一致：pluginId:accountId。
 */
export class InMemoryPluginKvStore implements PluginKvStore {
  private readonly entries = new Map<string, Map<string, ScopedEntry>>()

  async get(scope: string, key: string): Promise<unknown> {
    return this.entries.get(scope)?.get(key)?.value
  }

  async set(scope: string, key: string, value: unknown, quotaBytes: number): Promise<void> {
    const serialized = JSON.stringify(value)
    const bytes = Buffer.byteLength(serialized)
    const scopeEntries = this.entries.get(scope) ?? new Map<string, ScopedEntry>()
    const currentUsage = Array.from(scopeEntries.values()).reduce((total, entry) => total + entry.bytes, 0)
    const previous = scopeEntries.get(key)
    if (currentUsage - (previous?.bytes ?? 0) + bytes > quotaBytes) {
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        `插件存储超出配额（${quotaBytes} 字节）`,
        { scope, bytes },
      )
    }
    scopeEntries.set(key, { value: JSON.parse(serialized) as unknown, bytes })
    this.entries.set(scope, scopeEntries)
  }

  async delete(scope: string, key: string): Promise<void> {
    this.entries.get(scope)?.delete(key)
  }
}
