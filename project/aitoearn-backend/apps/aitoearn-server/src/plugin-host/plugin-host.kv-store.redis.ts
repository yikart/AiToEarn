import type { Redis } from 'ioredis'
import type { PluginKvStore } from './plugin-host.kv-store'
import { PluginError, PluginErrorCode } from '@airongrong/plugin-api'

const KEY_PREFIX = 'ait:plugin:'

/**
 * 配额校验 + 写入一条 Lua 脚本：
 * 统计 hash 内全部条目的字节数（扣除本字段旧值），超出配额拒绝写入。
 * 返回值 1 = 写入成功，0 = 超出配额。
 */
const SET_WITH_QUOTA_SCRIPT = `
local usage = 0
local entries = redis.call('HGETALL', KEYS[1])
for i = 2, #entries, 2 do
  local ok, meta = pcall(cjson.decode, entries[i])
  if ok and type(meta) == 'table' and meta['b'] then
    usage = usage + tonumber(meta['b'])
  end
end
local prev = redis.call('HGET', KEYS[1], ARGV[1])
if prev then
  local ok, meta = pcall(cjson.decode, prev)
  if ok and type(meta) == 'table' and meta['b'] then
    usage = usage - tonumber(meta['b'])
  end
end
if usage + tonumber(ARGV[3]) > tonumber(ARGV[4]) then
  return 0
end
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
return 1
`

interface StoredEntry {
  v: unknown
  b: number
}

/**
 * Redis 版插件 KV（复审 A 组：host.storage 进程内实现多实例部署会漂移）。
 * 分区键与内存版一致：hash key = ait:plugin:{pluginId}:{accountId}，field = 插件写入的 key。
 * field 值为 JSON 包裹的 { v: 值, b: 字节数 }，Lua 配额脚本依赖 b 字段统计用量。
 */
export class RedisPluginKvStore implements PluginKvStore {
  constructor(private readonly client: Redis) {}

  async get(scope: string, key: string): Promise<unknown> {
    const raw = await this.client.hget(this.redisKey(scope), key)
    return raw === null || raw === undefined ? undefined : (JSON.parse(raw) as StoredEntry)['v']
  }

  async set(scope: string, key: string, value: unknown, quotaBytes: number): Promise<void> {
    const bytes = Buffer.byteLength(JSON.stringify(value))
    const payload = JSON.stringify({ v: value, b: bytes } satisfies StoredEntry)
    const result = await this.client.eval(SET_WITH_QUOTA_SCRIPT, 1, this.redisKey(scope), key, payload, bytes, quotaBytes) as number
    if (Number(result) !== 1) {
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        `插件存储超出配额（${quotaBytes} 字节）`,
        { scope, bytes },
      )
    }
  }

  async delete(scope: string, key: string): Promise<void> {
    await this.client.hdel(this.redisKey(scope), key)
  }

  private redisKey(scope: string): string {
    return `${KEY_PREFIX}${scope}`
  }
}
