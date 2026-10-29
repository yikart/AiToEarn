import type { HostHttpResponse, PluginManifest } from '@airongrong/plugin-api'
import type { PluginKvStore } from './plugin-host.kv-store'
import {

  PluginError,
  PluginErrorCode,

  PluginType,
} from '@airongrong/plugin-api'
import { Injectable, Logger } from '@nestjs/common'

export interface CapabilityMessage {
  method: string
  params: Record<string, unknown>
}

export interface PluginBrokerDeps {
  resolveSecret: (pluginId: string, key: string, accountId?: string) => Promise<string>
  kvStore: PluginKvStore
  audit?: (entry: PluginAuditEntry) => void
  fetchImpl?: typeof fetch
  /**
   * 是否允许把明文密钥回传插件进程（P1-6）。
   * 默认 false：密钥只用于宿主侧注入（http.request 的 authSecret），插件永不接触明文。
   */
  allowRawSecrets?: boolean
}

export interface PluginAuditEntry {
  pluginId: string
  method: string
  allowed: boolean
  detail?: string
}

/** 宿主侧密钥注入描述：插件声明用哪个 key，宿主决定怎么放进请求头 */
export interface AuthSecretRef {
  key: string
  /** bearer → Authorization: Bearer <secret>；header → name: <secret> */
  in?: 'bearer' | 'header'
  name?: string
}

function headerNameOf(ref: AuthSecretRef): string {
  return ref.in === 'header' && ref.name ? ref.name : 'authorization'
}

function headerValueOf(ref: AuthSecretRef, secret: string): string {
  return ref.in === 'header' ? secret : `Bearer ${secret}`
}

const HOOK_ALLOWED_METHODS = new Set(['GET'])
const REQUEST_HEADER_DENYLIST = new Set(['host', 'content-length', 'connection', 'transfer-encoding'])
const HTTP_TIMEOUT_MS = 30_000
const HTTP_MAX_RETRIES = 2
const DEFAULT_STORAGE_QUOTA_BYTES = 1_048_576

const SENSITIVE_PATTERNS: Array<[RegExp, string]> = [
  [/Bearer\s+[\w.-]+/gi, 'Bearer ***'],
  [/[\w-]+\.[\w-]+\.[\w-]+/g, '***'],
  [/1[3-9]\d{9}/g, '***'],
  [/\b\d{17}[\dX]\b/gi, '***'],
]

export function sanitizePluginLog(message: string): string {
  return SENSITIVE_PATTERNS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    message,
  )
}

/**
 * 权限代理：插件拿到的不是 fetch、不是 process.env，而是这里的能力代理。
 * 网络白名单在代理层拦截，插件即使被投毒也无法访问未声明域名。
 */
@Injectable()
export class PluginHostBroker {
  private readonly logger = new Logger(PluginHostBroker.name)
  private readonly inFlight = new Set<Promise<unknown>>()

  constructor(
    private readonly manifest: PluginManifest,
    private readonly deps: PluginBrokerDeps,
  ) {}

  activeAccountId?: string

  async handle(message: CapabilityMessage): Promise<unknown> {
    switch (message.method) {
      case 'http.request':
        return this.handleHttpRequest(message.params)
      case 'secrets.use':
        return this.handleSecretUse(message.params)
      case 'storage.get':
        return this.deps.kvStore.get(this.storageScope(), String(message.params['key']))
      case 'storage.set':
        return this.handleStorageSet(message.params)
      case 'storage.delete':
        return this.deps.kvStore.delete(this.storageScope(), String(message.params['key']))
      case 'log':
        return this.handleLog(message.params)
      default:
        throw new PluginError(PluginErrorCode.PermissionViolation, `未知能力调用: ${message.method}`)
    }
  }

  private async handleHttpRequest(params: Record<string, unknown>): Promise<HostHttpResponse> {
    const url = new URL(String(params['url']))
    if (!this.manifest.permissions.network.some(domain => domain.toLowerCase() === url.hostname.toLowerCase())) {
      this.audit('http.request', false, url.hostname)
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        `域名未在白名单声明: ${url.hostname}`,
        { url: params['url'] },
      )
    }
    const method = String(params['method'] ?? 'GET').toUpperCase()
    if (this.manifest.type === PluginType.Hook && !HOOK_ALLOWED_METHODS.has(method)) {
      this.audit('http.request', false, `${method} ${url.hostname}`)
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        '钩子插件仅允许 GET 请求（读取平台规则）',
        { method },
      )
    }
    this.audit('http.request', true, `${method} ${url.hostname}`)

    const headers: Record<string, string> = {}
    for (const [name, value] of Object.entries((params['headers'] as Record<string, string>) ?? {})) {
      if (!REQUEST_HEADER_DENYLIST.has(name.toLowerCase())) {
        headers[name] = value
      }
    }
    // 密钥注入：宿主侧解析并写入请求头，插件全程拿不到明文（P1-6）
    const authSecret = params['authSecret'] as AuthSecretRef | undefined
    if (authSecret?.key) {
      headers[headerNameOf(authSecret)] = headerValueOf(authSecret, await this.resolveScopedSecret(authSecret.key))
    }
    const body = typeof params['body'] === 'string' ? params['body'] : undefined

    while (this.inFlight.size >= 8) {
      await Promise.race(this.inFlight)
    }
    const task = this.fetchWithRetry(url, method, headers, body)
    this.inFlight.add(task)
    try {
      return await task
    }
    finally {
      this.inFlight.delete(task)
    }
  }

  private async fetchWithRetry(url: URL, method: string, headers: Record<string, string>, body?: string): Promise<HostHttpResponse> {
    let lastError: unknown
    for (let attempt = 0; attempt <= HTTP_MAX_RETRIES; attempt += 1) {
      try {
        const response = await (this.deps.fetchImpl ?? fetch)(url, {
          method,
          headers,
          body,
          signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
          redirect: 'error',
        })
        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, name) => {
          if (name.toLowerCase() !== 'set-cookie') {
            responseHeaders[name] = value
          }
        })
        if (response.status >= 500 && attempt < HTTP_MAX_RETRIES) {
          lastError = new Error(`上游 5xx: ${response.status}`)
          continue
        }
        return { status: response.status, headers: responseHeaders, body: await response.text() }
      }
      catch (error) {
        lastError = error
        if (attempt < HTTP_MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 100 * 2 ** attempt))
        }
      }
    }
    throw lastError
  }

  private async handleSecretUse(params: Record<string, unknown>): Promise<string> {
    const key = String(params['key'])
    if (!this.manifest.permissions.secrets?.includes(key)) {
      this.audit('secrets.use', false, key)
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        `密钥键未在 permissions.secrets 声明: ${key}`,
      )
    }
    if (this.deps.allowRawSecrets !== true) {
      this.audit('secrets.use', false, `${key} (raw denied)`)
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        `默认禁止向插件回传明文密钥: ${key}，请改用 http.request 的 authSecret 由宿主注入`,
        { fix: 'host.http.request({ url, authSecret: { key, in: "bearer" } })' },
      )
    }
    this.audit('secrets.use', true, key)
    return this.resolveScopedSecret(key)
  }

  private async resolveScopedSecret(key: string): Promise<string> {
    if (!this.manifest.permissions.secrets?.includes(key)) {
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        `密钥键未在 permissions.secrets 声明: ${key}`,
      )
    }
    return this.deps.resolveSecret(this.manifest.id, key, this.activeAccountId)
  }

  private async handleStorageSet(params: Record<string, unknown>): Promise<void> {
    if (!this.manifest.permissions.storage?.kv) {
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        '插件未声明 permissions.storage.kv',
      )
    }
    const quota = this.manifest.permissions.storage.bytes ?? DEFAULT_STORAGE_QUOTA_BYTES
    await this.deps.kvStore.set(this.storageScope(), String(params['key']), params['value'], quota)
  }

  private handleLog(params: Record<string, unknown>): void {
    const level = String(params['level'] ?? 'info')
    const message = sanitizePluginLog(String(params['message']))
    const meta = { pluginId: this.manifest.id, ...(params['meta'] as Record<string, unknown> ?? {}) }
    if (level === 'error') {
      this.logger.error(message, meta)
    }
    else if (level === 'warn') {
      this.logger.warn(message, meta)
    }
    else {
      this.logger.log(message, meta)
    }
  }

  private storageScope(): string {
    return `${this.manifest.id}:${this.activeAccountId ?? '_'}`
  }

  private audit(method: string, allowed: boolean, detail?: string): void {
    this.deps.audit?.({ pluginId: this.manifest.id, method, allowed, detail })
  }
}
