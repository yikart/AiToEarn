// Minimal MCP Streamable HTTP client used by the plugin.
//
// The DSH MCP client bridge only supports static headers, so OAuth tokens
// (which expire and refresh) cannot be injected through cordis config. This
// client owns the Authorization header per request and retries once after a
// refresh when the server answers 401/403.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAccessToken } from './oauth.js'

const LOGIN_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'aitoearn.mjs')

export const MCP_PROTOCOL_VERSION = '2025-06-18'
const DEFAULT_TIMEOUT_MS = 60_000

export class McpAuthError extends Error {
  constructor(message, { cause } = {}) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'McpAuthError'
    this.code = 'mcp_auth_required'
  }
}

export class McpRequestError extends Error {
  constructor(message, { code = 'mcp_request_failed', cause } = {}) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'McpRequestError'
    this.code = code
  }
}

/** OAuth token provider. */
export function createTokenProvider(url) {
  return {
    async get(forceRefresh = false) {
      const oauthToken = await getAccessToken(url, { forceRefresh }).catch(() => null)
      if (oauthToken) return { token: oauthToken, source: 'oauth' }
      return { token: null, source: 'none' }
    },
  }
}

function safeJson(text) {
  try { return JSON.parse(text) } catch { return null }
}

function parseSse(body) {
  const events = []
  for (const block of body.split(/\r?\n\r?\n/)) {
    for (const line of block.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      const parsed = safeJson(data)
      if (parsed && typeof parsed === 'object') events.push(parsed)
    }
  }
  return events
}

export class McpHttpClient {
  constructor({ url, serverName = 'aitoearn', tokenProvider = createTokenProvider(url), timeoutMs = DEFAULT_TIMEOUT_MS }) {
    this.url = url
    this.serverName = serverName
    this.tokenProvider = tokenProvider
    this.timeoutMs = timeoutMs
    this.sessionId = ''
    this.protocolVersion = MCP_PROTOCOL_VERSION
    this.nextId = 1
    this.initialized = false
  }

  async #headers(extra = {}) {
    const { token } = await this.tokenProvider.get(false)
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...extra,
    }
    if (token) headers.Authorization = `Bearer ${token}`
    if (this.sessionId) headers['mcp-session-id'] = this.sessionId
    if (this.initialized) headers['mcp-protocol-version'] = this.protocolVersion
    return headers
  }

  async #post(payload, { signal } = {}) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
    const onAbort = () => controller.abort()
    if (signal) {
      if (signal.aborted) controller.abort()
      else signal.addEventListener('abort', onAbort, { once: true })
    }
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        headers: await this.#headers(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      const session = res.headers.get('mcp-session-id')
      if (session) this.sessionId = session
      const text = await res.text()
      return { res, text }
    } finally {
      clearTimeout(timeout)
      if (signal) signal.removeEventListener('abort', onAbort)
    }
  }

  /** Send one JSON-RPC message and return its response (or null for 202/204). */
  async request(method, params, { signal, id = this.nextId++ } = {}) {
    const payload = { jsonrpc: '2.0', id, method, ...(params === undefined ? {} : { params }) }
    let { res, text } = await this.#post(payload, { signal })

    if (res.status === 401 || res.status === 403) {
      const refreshed = await this.tokenProvider.get(true)
      if (refreshed.token) {
        ;({ res, text } = await this.#post(payload, { signal }))
      }
      if (res.status === 401 || res.status === 403) {
        throw new McpAuthError(
          'AiToEarn 拒绝了鉴权（HTTP ' + res.status + '）。请完成 OAuth 授权：' +
            `node "${LOGIN_SCRIPT}" login`,
          { cause: new Error(text.slice(0, 300)) },
        )
      }
    }

    if (res.status === 202 || res.status === 204) return null
    if (!res.ok) {
      throw new McpRequestError(`AiToEarn MCP 请求失败（HTTP ${res.status}）：${text.slice(0, 300)}`)
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    const messages = contentType.includes('text/event-stream') ? parseSse(text) : [safeJson(text)]
    const reply = messages.find((m) => m && m.id === id)
      ?? messages.filter((m) => m && m.result !== undefined).pop()
      ?? messages.filter((m) => m && m.error !== undefined).pop()
      ?? null

    if (!reply) throw new McpRequestError('AiToEarn MCP 返回了空响应')
    if (reply.error) {
      throw new McpRequestError(`AiToEarn MCP 错误 ${reply.error.code ?? ''}: ${reply.error.message ?? 'unknown'}`)
    }
    return reply.result ?? reply
  }

  async notify(method, params) {
    const headers = await this.#headers()
    await fetch(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', method, ...(params === undefined ? {} : { params }) }),
      signal: AbortSignal.timeout(this.timeoutMs),
    }).catch(() => { /* notifications are best effort */ })
  }

  /** MCP initialize + initialized handshake. */
  async initialize() {
    const result = await this.request('initialize', {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'dsh-plugin-aitoearn', version: '0.1.0' },
    })
    this.protocolVersion = result?.protocolVersion || MCP_PROTOCOL_VERSION
    this.initialized = true
    await this.notify('notifications/initialized')
  }

  async listTools() {
    const tools = []
    let cursor
    do {
      const result = await this.request('tools/list', cursor === undefined ? {} : { cursor })
      if (!Array.isArray(result?.tools)) {
        throw new McpRequestError('AiToEarn MCP 返回的 tools/list 格式不正确')
      }
      tools.push(...result.tools)
      cursor = result.nextCursor
    } while (cursor)
    return tools
  }

  callTool(name, args, { signal } = {}) {
    return this.request('tools/call', { name, arguments: args }, { signal })
  }

  async close() {
    this.initialized = false
    this.sessionId = ''
  }
}
