import { PluginError, PluginErrorCode, verifyManifest } from '@airongrong/plugin-api'
import { describe, expect, it, vi } from 'vitest'
import { PluginHostBroker, sanitizePluginLog } from './plugin-host.broker'
import { InMemoryPluginKvStore } from './plugin-host.kv-store'

function createBroker(manifestInput: Record<string, unknown>, deps: {
  resolveSecret?: (pluginId: string, key: string, accountId?: string) => Promise<string>
  allowRawSecrets?: boolean
} = {}) {
  const manifest = verifyManifest({
    id: 'hook.test',
    version: '1.0.0',
    apiVersion: '^1.0.0',
    type: 'hook',
    description: '测试',
    entry: { module: './dist/index.mjs', sha256: '3f9a1c2e4b8a7d6f0e1c2a3b4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a' },
    contributes: { hooks: ['beforePublish'] },
    permissions: { network: ['open.example.com'] },
    engines: { aitoearn: '>=1.0.0' },
    license: 'MIT',
    ...manifestInput,
  })
  const audit: Array<{ allowed: boolean, detail?: string }> = []
  const broker = new PluginHostBroker(manifest, {
    resolveSecret: deps.resolveSecret ?? (async () => 'value'),
    kvStore: new InMemoryPluginKvStore(),
    audit: entry => audit.push(entry),
    ...(deps.allowRawSecrets === undefined ? {} : { allowRawSecrets: deps.allowRawSecrets }),
  })
  return { broker, audit }
}

describe('pluginHostBroker 网络白名单', () => {
  it('白名单内域名放行', async () => {
    const fetchImpl = vi.fn(async () => new Response('ok', { status: 200 }))
    const { broker } = createBroker({})
    // @ts-expect-error 注入 fetch 替身
    broker['deps'].fetchImpl = fetchImpl
    const result = await broker.handle({ method: 'http.request', params: { url: 'https://open.example.com/api', method: 'GET' } })
    expect((result as { status: number }).status).toBe(200)
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  it('白名单外请求 100% 拦截并记审计（AIT-PL-005）', async () => {
    const fetchImpl = vi.fn()
    const { broker, audit } = createBroker({})
    // @ts-expect-error 注入 fetch 替身
    broker['deps'].fetchImpl = fetchImpl
    await expect(broker.handle({ method: 'http.request', params: { url: 'https://evil.com/steal' } }))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(audit).toContainEqual(expect.objectContaining({ allowed: false, detail: 'evil.com' }))
  })

  it('子域名不命中父域名白名单（禁止通配语义）', async () => {
    const { broker } = createBroker({})
    await expect(broker.handle({ method: 'http.request', params: { url: 'https://sub.open.example.com/x' } }))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
  })

  it('钩子插件仅允许 GET', async () => {
    const fetchImpl = vi.fn(async () => new Response('ok'))
    const { broker } = createBroker({})
    // @ts-expect-error 注入 fetch 替身
    broker['deps'].fetchImpl = fetchImpl
    await expect(broker.handle({ method: 'http.request', params: { url: 'https://open.example.com/post', method: 'POST' } }))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('剥离 host/content-length 请求头与 set-cookie 响应头', async () => {
    let captured: RequestInit | undefined
    const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
      captured = init
      return new Response('ok', { headers: { 'set-cookie': 'a=1', 'content-type': 'text/plain' } })
    })
    const { broker } = createBroker({})
    // @ts-expect-error 注入 fetch 替身
    broker['deps'].fetchImpl = fetchImpl
    const result = await broker.handle({
      method: 'http.request',
      params: { url: 'https://open.example.com', headers: { 'Host': 'evil', 'X-Custom': 'keep' } },
    }) as { headers: Record<string, string> }
    expect(Object.keys(captured?.headers ?? {})).not.toContain('Host')
    expect(Object.keys(captured?.headers ?? {})).toContain('X-Custom')
    expect(result.headers).not.toHaveProperty('set-cookie')
    expect(result.headers).toHaveProperty('content-type')
  })
})

describe('pluginHostBroker 密钥与存储', () => {
  it('未声明的密钥键被拒绝（AIT-PL-005）', async () => {
    const { broker } = createBroker({ permissions: { network: [], secrets: ['oauth.access_token'] } })
    await expect(broker.handle({ method: 'secrets.use', params: { key: 'oauth.refresh_token' } }))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
  })

  it('默认拒绝把明文密钥回传插件（P1-6）', async () => {
    const resolveSecret = vi.fn(async () => 'token-value')
    const { broker, audit } = createBroker({ permissions: { network: [], secrets: ['oauth.access_token'] } }, { resolveSecret })
    await expect(broker.handle({ method: 'secrets.use', params: { key: 'oauth.access_token' } }))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
    expect(resolveSecret).not.toHaveBeenCalled()
    expect(audit).toContainEqual(expect.objectContaining({ allowed: false }))
  })

  it('allowRawSecrets=true 时仍可回传明文，并携带账号分区', async () => {
    const resolveSecret = vi.fn(async () => 'token-value')
    const { broker } = createBroker(
      { permissions: { network: [], secrets: ['oauth.access_token'] } },
      { resolveSecret, allowRawSecrets: true },
    )
    broker.activeAccountId = 'acc-1'
    const value = await broker.handle({ method: 'secrets.use', params: { key: 'oauth.access_token' } })
    expect(value).toBe('token-value')
    expect(resolveSecret).toHaveBeenCalledWith('hook.test', 'oauth.access_token', 'acc-1')
  })

  it('authSecret 由宿主注入 Authorization，插件拿不到明文', async () => {
    let captured: RequestInit | undefined
    const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
      captured = init
      return new Response('ok', { status: 200 })
    })
    const resolveSecret = vi.fn(async () => 'token-value')
    const { broker } = createBroker(
      { permissions: { network: ['open.example.com'], secrets: ['oauth.access_token'] } },
      { resolveSecret },
    )
    // @ts-expect-error 注入 fetch 替身
    broker['deps'].fetchImpl = fetchImpl
    const result = await broker.handle({
      method: 'http.request',
      params: {
        url: 'https://open.example.com/api',
        method: 'GET',
        authSecret: { key: 'oauth.access_token', in: 'bearer' },
      },
    }) as { status: number, headers: Record<string, string> }
    expect(result.status).toBe(200)
    expect((captured?.headers as Record<string, string>)['authorization']).toBe('Bearer token-value')
    // 明文不出现在响应回传中
    expect(JSON.stringify(result.headers)).not.toContain('token-value')
  })

  it('未声明 storage.kv 的插件写入存储被拒绝', async () => {
    const { broker } = createBroker({})
    await expect(broker.handle({ method: 'storage.set', params: { key: 'k', value: 'v' } }))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
  })

  it('存储按 pluginId + accountId 分区并强制配额', async () => {
    const kvStore = new InMemoryPluginKvStore()
    const manifest = verifyManifest({
      id: 'hook.test',
      version: '1.0.0',
      apiVersion: '^1.0.0',
      type: 'hook',
      description: '测试',
      entry: { module: './dist/index.mjs', sha256: '3f9a1c2e4b8a7d6f0e1c2a3b4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a' },
      contributes: { hooks: ['beforePublish'] },
      permissions: { network: [], storage: { kv: true, bytes: 16 } },
      engines: { aitoearn: '>=1.0.0' },
      license: 'MIT',
    })
    const broker = new PluginHostBroker(manifest, { resolveSecret: async () => '', kvStore })
    broker.activeAccountId = 'acc-1'
    await broker.handle({ method: 'storage.set', params: { key: 'k', value: '1234567890' } })
    await expect(broker.handle({ method: 'storage.set', params: { key: 'k2', value: '1234567890' } }))
      .rejects
      .toMatchObject({ code: PluginErrorCode.PermissionViolation })
    broker.activeAccountId = 'acc-2'
    await broker.handle({ method: 'storage.set', params: { key: 'k2', value: '1234567890' } })
    expect(await kvStore.get('hook.test:acc-1', 'k')).toBe('1234567890')
  })
})

describe('sanitizePluginLog', () => {
  it('脱敏 token、手机号与身份证', () => {
    expect(sanitizePluginLog('token Bearer abc.def.ghi phone 13812345678')).not.toContain('13812345678')
    expect(sanitizePluginLog('id 110101199001011234')).not.toContain('110101199001011234')
    expect(sanitizePluginLog('普通日志')).toBe('普通日志')
  })
})

describe('pluginError', () => {
  it('携带错误码与细节', () => {
    const error = new PluginError(PluginErrorCode.HookRejected, '拒绝', { pluginId: 'x' })
    expect(error.code).toBe('AIT-PL-007')
    expect(error.details).toEqual({ pluginId: 'x' })
  })
})
