// OAuth 2.1 (authorization code + PKCE / device flow) client for AiToEarn MCP.
//
// Tokens live in ~/.aitoearn/oauth.json (mode 0600), keyed by server origin.
// No token is ever printed to stdout.
import { createHash, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, chmodSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'

export const SITES = {
  cn: 'https://aitoearn.cn',
}

export const DEFAULT_MCP_PATH = '/api/ai/agent/mcp'
export const DEFAULT_CALLBACK_PORT = 0
const DISCOVERY_TIMEOUT_MS = 15000
const TOKEN_TIMEOUT_MS = 30000
const REFRESH_SKEW_MS = 60_000
const DEVICE_FLOW_DEFAULT_INTERVAL_S = 5
const DEVICE_FLOW_DEFAULT_TIMEOUT_S = 600
const AUTH_TIMEOUT_MS = 15 * 60_000

export class OAuthError extends Error {
  constructor(message, { code = 'oauth_error', cause } = {}) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'OAuthError'
    this.code = code
  }
}

/* ------------------------------------------------------------------ store -- */

export function storePath() {
  return process.env.AITOEARN_OAUTH_STORE || join(homedir(), '.aitoearn', 'oauth.json')
}

export function siteKey(url) {
  return new URL(url).origin
}

export function readStore() {
  const file = storePath()
  if (!existsSync(file)) return { version: 1, sites: {} }
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    if (!parsed || typeof parsed !== 'object') return { version: 1, sites: {} }
    return {
      version: 1,
      selectedSite: parsed.selectedSite === 'cn' ? parsed.selectedSite : '',
      sites: parsed.sites && typeof parsed.sites === 'object' ? parsed.sites : {},
    }
  } catch {
    return { version: 1, sites: {} }
  }
}

function writeStore(store) {
  const file = storePath()
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(store, null, 2) + '\n', { mode: 0o600 })
  renameSync(tmp, file)
  try { chmodSync(file, 0o600) } catch { /* best effort */ }
}

export function readSelectedSite() {
  const site = readStore().selectedSite
  return site === 'cn' || site === 'ai' ? site : ''
}

export function saveSelectedSite(site) {
  if (site !== 'cn') {
    throw new OAuthError('只支持国内站 cn（https://aitoearn.cn）', { code: 'bad_site' })
  }
  const store = readStore()
  store.selectedSite = site
  writeStore(store)
}

export function readRecord(url) {
  return readStore().sites[siteKey(url)] || null
}

export function saveRecord(url, record) {
  const store = readStore()
  store.sites[siteKey(url)] = record
  writeStore(store)
}

export function removeRecord(url) {
  const store = readStore()
  delete store.sites[siteKey(url)]
  writeStore(store)
}

/** mtime is used by the plugin to notice a fresh CLI login without a restart. */
export function storeMtimeMs() {
  try { return statSync(storePath()).mtimeMs } catch { return 0 }
}

/* -------------------------------------------------------------- helpers ---- */

async function fetchJson(url, init, timeoutMs = DISCOVERY_TIMEOUT_MS) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { /* not JSON */ }
  return { res, text, json }
}

function wellKnownCandidates(base, suffix) {
  const origin = base.origin
  const path = base.pathname.replace(/\/+$/, '')
  const list = []
  if (suffix) list.push(`${origin}/.well-known/${suffix}${path}`)
  list.push(`${origin}/.well-known/${suffix}`)
  return list
}

async function fetchFirstJson(urls) {
  for (const url of urls) {
    try {
      const { res, json } = await fetchJson(url, { headers: { Accept: 'application/json' } })
      if (res.ok && json && typeof json === 'object') return json
    } catch { /* try next */ }
  }
  return null
}

/** RFC 9728 protected resource metadata; the resource is the MCP endpoint. */
export async function discoverProtectedResource(mcpUrl) {
  const resource = new URL(mcpUrl)
  const meta = await fetchFirstJson(wellKnownCandidates(resource, 'oauth-protected-resource'))
  if (!meta) return null
  return {
    resource: typeof meta.resource === 'string' ? meta.resource : mcpUrl,
    authorizationServers: Array.isArray(meta.authorization_servers) ? meta.authorization_servers : [],
    scopesSupported: Array.isArray(meta.scopes_supported) ? meta.scopes_supported : [],
    raw: meta,
  }
}

/** RFC 8414 authorization server metadata (with OIDC discovery fallback). */
export async function discoverAuthorizationServer(issuerUrl) {
  const issuer = new URL(issuerUrl)
  const meta = await fetchFirstJson([
    ...wellKnownCandidates(issuer, 'oauth-authorization-server'),
    ...wellKnownCandidates(issuer, 'openid-configuration'),
  ])
  if (!meta) return null
  return {
    issuer: typeof meta.issuer === 'string' ? meta.issuer : issuerUrl,
    authorizationEndpoint: meta.authorization_endpoint,
    tokenEndpoint: meta.token_endpoint,
    registrationEndpoint: meta.registration_endpoint,
    deviceAuthorizationEndpoint: meta.device_authorization_endpoint,
    scopesSupported: Array.isArray(meta.scopes_supported) ? meta.scopes_supported : [],
    tokenEndpointAuthMethods: Array.isArray(meta.token_endpoint_auth_methods_supported)
      ? meta.token_endpoint_auth_methods_supported
      : [],
    codeChallengeMethods: Array.isArray(meta.code_challenge_methods_supported)
      ? meta.code_challenge_methods_supported
      : [],
    raw: meta,
  }
}

/**
 * Resolve OAuth endpoints. Explicit environment variables win, so deployments
 * without discovery metadata can still be used.
 */
export async function resolveEndpoints({ url, scope } = {}) {
  const env = process.env
  const mcpUrl = url || env.AITOEARN_MCP_URL || `${SITES.cn}${DEFAULT_MCP_PATH}`
  const explicit = {
    issuer: env.AITOEARN_OAUTH_ISSUER || '',
    authorizationEndpoint: env.AITOEARN_OAUTH_AUTHORIZE_URL || '',
    tokenEndpoint: env.AITOEARN_OAUTH_TOKEN_URL || '',
    registrationEndpoint: env.AITOEARN_OAUTH_REGISTRATION_URL || '',
    deviceAuthorizationEndpoint: env.AITOEARN_OAUTH_DEVICE_AUTHORIZATION_URL || '',
  }

  const prm = await discoverProtectedResource(mcpUrl).catch(() => null)
  const issuer = explicit.issuer
    || prm?.authorizationServers?.[0]
    || new URL(mcpUrl).origin

  const as = explicit.authorizationEndpoint && explicit.tokenEndpoint
    ? null
    : await discoverAuthorizationServer(issuer).catch(() => null)

  const resolved = {
    mcpUrl,
    issuer,
    scope: scope || env.AITOEARN_OAUTH_SCOPE || (prm?.scopesSupported?.length ? prm.scopesSupported.join(' ') : ''),
    authorizationEndpoint: explicit.authorizationEndpoint || as?.authorizationEndpoint || '',
    tokenEndpoint: explicit.tokenEndpoint || as?.tokenEndpoint || '',
    registrationEndpoint: explicit.registrationEndpoint || as?.registrationEndpoint || '',
    deviceAuthorizationEndpoint:
      explicit.deviceAuthorizationEndpoint || as?.deviceAuthorizationEndpoint || '',
    tokenEndpointAuthMethods: as?.tokenEndpointAuthMethods || [],
    codeChallengeMethods: as?.codeChallengeMethods || [],
    discovered: Boolean(as || prm),
  }

  if (!resolved.tokenEndpoint) {
    throw new OAuthError(
      `未发现 OAuth 授权服务器（${issuer}）。` +
        '请确认该站点已开启 MCP OAuth，或通过 AITOEARN_OAUTH_AUTHORIZE_URL / AITOEARN_OAUTH_TOKEN_URL 显式指定端点。',
      { code: 'discovery_failed' },
    )
  }
  return resolved
}

/* ------------------------------------------------------- client metadata --- */

function basicAuth(clientId, clientSecret) {
  return 'Basic ' + Buffer.from(`${encodeURIComponent(clientId)}:${encodeURIComponent(clientSecret)}`).toString('base64')
}

function tokenRequestHeaders({ clientId, clientSecret }) {
  if (!clientSecret) return {}
  if (process.env.AITOEARN_OAUTH_TOKEN_AUTH === 'client_secret_basic') {
    return { Authorization: basicAuth(clientId, clientSecret) }
  }
  return {}
}

/**
 * Register a public client with dynamic client registration (RFC 7591).
 * Falls back to `AITOEARN_OAUTH_CLIENT_ID` when the server has no DCR.
 */
export async function registerClient(endpoints, { redirectUri, scope, clientName }) {
  const envClientId = process.env.AITOEARN_OAUTH_CLIENT_ID
  if (envClientId) {
    return { clientId: envClientId, clientSecret: process.env.AITOEARN_OAUTH_CLIENT_SECRET || '' }
  }
  if (!endpoints.registrationEndpoint) {
    throw new OAuthError(
      '授权服务器未提供动态客户端注册，且未设置 AITOEARN_OAUTH_CLIENT_ID。请先在 AiToEarn 创建 OAuth 客户端并设置该环境变量。',
      { code: 'client_registration_unavailable' },
    )
  }
  // Only request the device-code grant when the server actually offers device
  // flow; strict servers reject unknown grant types.
  const grantTypes = ['authorization_code', 'refresh_token']
  if (endpoints.deviceAuthorizationEndpoint) {
    grantTypes.push('urn:ietf:params:oauth:grant-type:device_code')
  }
  const body = {
    client_name: clientName || 'DeepSeek Harness (AiToEarn)',
    redirect_uris: [redirectUri],
    grant_types: grantTypes,
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    ...(scope ? { scope } : {}),
  }
  const { res, text, json } = await fetchJson(endpoints.registrationEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok || !json?.client_id) {
    throw new OAuthError(`客户端注册失败（HTTP ${res.status}）：${text.slice(0, 300)}`, {
      code: 'client_registration_failed',
    })
  }
  return {
    clientId: json.client_id,
    clientSecret: json.client_secret || '',
    tokenEndpointAuthMethod: json.token_endpoint_auth_method || 'none',
  }
}

/* ----------------------------------------------------------------- tokens -- */

function expiresAtFrom(tokens) {
  const expiresIn = Number(tokens?.expires_in)
  return Number.isFinite(expiresIn) && expiresIn > 0 ? Date.now() + expiresIn * 1000 : 0
}

async function postToken(endpoints, record, params) {
  const body = new URLSearchParams(params)
  if (record.clientSecret && !body.has('client_secret')) body.set('client_secret', record.clientSecret)
  const { res, text, json } = await fetchJson(endpoints.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      ...tokenRequestHeaders(record),
    },
    body: body.toString(),
  }, TOKEN_TIMEOUT_MS)
  if (!res.ok || !json?.access_token) {
    const error = json?.error || `HTTP ${res.status}`
    const description = json?.error_description ? `: ${json.error_description}` : ''
    throw new OAuthError(`令牌请求失败（${error}${description}）`, { code: 'token_request_failed' })
  }
  return json
}

export async function refreshRecord(url, record) {
  if (!record?.refreshToken || !record.tokenEndpoint) return null
  const tokens = await postToken(
    { tokenEndpoint: record.tokenEndpoint },
    record,
    { grant_type: 'refresh_token', refresh_token: record.refreshToken, ...(record.scope ? { scope: record.scope } : {}) },
  )
  const next = {
    ...record,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || record.refreshToken,
    tokenType: tokens.token_type || 'Bearer',
    scope: tokens.scope || record.scope || '',
    expiresAt: expiresAtFrom(tokens),
    refreshedAt: Date.now(),
  }
  saveRecord(url, next)
  return next
}

/**
 * Return a usable bearer token for `url`, refreshing when it is close to
 * expiry. Returns null when the user has not authorized yet.
 */
export async function getAccessToken(url, { forceRefresh = false } = {}) {
  const record = readRecord(url)
  if (!record?.accessToken && !record?.refreshToken) return null

  const expiring = forceRefresh
    || !record.accessToken
    || (record.expiresAt > 0 && record.expiresAt - REFRESH_SKEW_MS <= Date.now())
  if (!expiring) return record.accessToken

  try {
    const refreshed = await refreshRecord(url, record)
    if (refreshed) return refreshed.accessToken
  } catch {
    if (!forceRefresh) return record.accessToken
  }
  return forceRefresh ? null : record.accessToken
}

/* -------------------------------------------------------------- device ----- */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function deviceFlow(endpoints, client, { scope, mcpUrl, onPrompt }) {
  if (!endpoints.deviceAuthorizationEndpoint) {
    throw new OAuthError('授权服务器未提供设备码端点', { code: 'device_flow_unavailable' })
  }
  const body = new URLSearchParams({
    client_id: client.clientId,
    ...(scope ? { scope } : {}),
    ...(mcpUrl ? { resource: mcpUrl } : {}),
  })
  const { res, text, json } = await fetchJson(endpoints.deviceAuthorizationEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  })
  if (!res.ok || !json?.device_code) {
    throw new OAuthError(`设备码申请失败（HTTP ${res.status}）：${text.slice(0, 200)}`, {
      code: 'device_flow_failed',
    })
  }

  onPrompt(
    `请在浏览器打开 ${json.verification_uri || json.verification_url}` +
      (json.verification_uri_complete ? `\n或直接打开：${json.verification_uri_complete}` : '') +
      `\n并输入代码：${json.user_code}`,
  )

  const intervalMs = Math.max(1, Number(json.interval) || DEVICE_FLOW_DEFAULT_INTERVAL_S) * 1000
  const deadline = Date.now() + (Number(json.expires_in) || DEVICE_FLOW_DEFAULT_TIMEOUT_S) * 1000
  let wait = intervalMs

  while (Date.now() < deadline) {
    await sleep(wait)
    const { res: pollRes, json: poll } = await fetchJson(endpoints.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        ...tokenRequestHeaders(client),
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: json.device_code,
        client_id: client.clientId,
      }).toString(),
    }, TOKEN_TIMEOUT_MS)

    if (pollRes.ok && poll?.access_token) return poll
    if (poll?.error === 'authorization_pending') continue
    if (poll?.error === 'slow_down') { wait += 5000; continue }
    if (poll?.error === 'access_denied') {
      throw new OAuthError('用户拒绝了授权', { code: 'access_denied' })
    }
    if (poll?.error === 'expired_token') {
      throw new OAuthError('设备码已过期，请重新登录', { code: 'expired_token' })
    }
    if (poll?.error) {
      throw new OAuthError(`设备码轮询失败：${poll.error}`, { code: 'device_flow_failed' })
    }
  }
  throw new OAuthError('设备码授权超时，请重试', { code: 'device_flow_timeout' })
}

/* ------------------------------------------------------------- loopback ---- */

function pkcePair() {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

function openBrowser(url) {
  if (process.env.AITOEARN_OAUTH_OPEN_BROWSER === '0') return
  const platform = process.platform
  const [cmd, args] = platform === 'darwin'
    ? ['open', [url]]
    : platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : ['xdg-open', [url]]
  try {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' })
    child.unref()
  } catch { /* user can copy the URL manually */ }
}

async function loopbackFlow(endpoints, { scope, mcpUrl, onPrompt }) {
  if (!endpoints.authorizationEndpoint) {
    throw new OAuthError('授权服务器未提供授权端点', { code: 'missing_authorization_endpoint' })
  }
  const { verifier, challenge } = pkcePair()
  const state = randomBytes(24).toString('base64url')
  const callbackPort = Number(process.env.AITOEARN_OAUTH_CALLBACK_PORT ?? DEFAULT_CALLBACK_PORT) || 0

  const server = createServer()
  let authTimer = null
  const codePromise = new Promise((resolve, reject) => {
    authTimer = setTimeout(() => reject(new OAuthError('授权回调超时', { code: 'authorization_timeout' })), AUTH_TIMEOUT_MS)
    server.on('request', (req, res) => {
      const requestUrl = new URL(req.url || '/', 'http://127.0.0.1')
      if (requestUrl.pathname !== '/oauth/callback') {
        res.writeHead(404).end('Not found')
        return
      }
      const error = requestUrl.searchParams.get('error')
      const code = requestUrl.searchParams.get('code')
      const receivedState = requestUrl.searchParams.get('state')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(
        error
          ? '<!doctype html><meta charset="utf-8"><title>Authorization failed</title><p>Authorization failed. Return to DeepSeek Harness.</p>'
          : '<!doctype html><meta charset="utf-8"><title>Authorized</title><p>Authorization complete. You may close this window.</p>',
      )
      clearTimeout(authTimer)
      if (error) reject(new OAuthError(`授权被拒绝：${error}`, { code: 'access_denied' }))
      else if (receivedState !== state) reject(new OAuthError('OAuth state 校验失败', { code: 'state_mismatch' }))
      else if (!code) reject(new OAuthError('授权回调缺少 code', { code: 'missing_code' }))
      else resolve(code)
    })
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(callbackPort, '127.0.0.1', resolve)
  })
  const address = server.address()
  const redirectUri = `http://127.0.0.1:${address.port}/oauth/callback`

  try {
    // The loopback port is known only now, so this is where a public client is
    // registered (or an explicitly configured client is used as-is).
    let client
    if (process.env.AITOEARN_OAUTH_CLIENT_ID) {
      client = {
        clientId: process.env.AITOEARN_OAUTH_CLIENT_ID,
        clientSecret: process.env.AITOEARN_OAUTH_CLIENT_SECRET || '',
        redirectUri,
      }
    } else {
      const registered = await registerClient(endpoints, {
        redirectUri,
        scope,
        clientName: 'DeepSeek Harness (AiToEarn)',
      })
      client = { ...registered, redirectUri }
    }

    const authUrl = new URL(endpoints.authorizationEndpoint)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', client.clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', challenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    if (scope) authUrl.searchParams.set('scope', scope)
    if (mcpUrl) authUrl.searchParams.set('resource', mcpUrl)

    onPrompt(`请在浏览器完成授权：\n${authUrl.toString()}`)
    openBrowser(authUrl.toString())

    const code = await codePromise
    const tokens = await postToken(
      endpoints,
      client,
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: client.clientId,
        code_verifier: verifier,
        ...(mcpUrl ? { resource: mcpUrl } : {}),
      },
    )
    return { tokens, client, redirectUri }
  } finally {
    if (authTimer) clearTimeout(authTimer)
    await new Promise((resolve) => server.close(resolve))
  }
}

/* ----------------------------------------------------------------- login --- */

/**
 * Run the interactive OAuth login and persist the token record.
 * Prefers device flow when the authorization server advertises it.
 */
export async function login({ site, url, scope, onPrompt = () => {} } = {}) {
  const base = site ? SITES[site] : null
  if (site && !base) throw new OAuthError('只支持国内站 cn（https://aitoearn.cn）', { code: 'bad_site' })
  if (!url && !base) throw new OAuthError('只支持国内站 cn（https://aitoearn.cn）', { code: 'site_required' })
  const mcpUrl = url || `${base}${DEFAULT_MCP_PATH}`
  const endpoints = await resolveEndpoints({ url: mcpUrl, scope })
  const effectiveScope = scope || endpoints.scope || ''

  let flow = 'authorization_code'
  let client
  let tokens

  if (endpoints.deviceAuthorizationEndpoint) {
    flow = 'device_code'
    client = process.env.AITOEARN_OAUTH_CLIENT_ID
      ? {
          clientId: process.env.AITOEARN_OAUTH_CLIENT_ID,
          clientSecret: process.env.AITOEARN_OAUTH_CLIENT_SECRET || '',
        }
      : await registerClient(endpoints, {
          redirectUri: 'http://127.0.0.1/oauth/callback',
          scope: effectiveScope,
          clientName: 'DeepSeek Harness (AiToEarn)',
        })
    tokens = await deviceFlow(endpoints, client, { scope: effectiveScope, mcpUrl, onPrompt })
  } else {
    const result = await loopbackFlow(endpoints, {
      scope: effectiveScope,
      mcpUrl,
      onPrompt,
    })
    tokens = result.tokens
    client = result.client
  }

  const record = {
    issuer: endpoints.issuer,
    mcpUrl,
    flow,
    clientId: client.clientId,
    clientSecret: client.clientSecret || '',
    tokenEndpoint: endpoints.tokenEndpoint,
    authorizationEndpoint: endpoints.authorizationEndpoint || '',
    deviceAuthorizationEndpoint: endpoints.deviceAuthorizationEndpoint || '',
    scope: tokens.scope || effectiveScope,
    tokenType: tokens.token_type || 'Bearer',
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || '',
    expiresAt: expiresAtFrom(tokens),
    createdAt: Date.now(),
  }
  saveRecord(mcpUrl, record)
  return record
}

/** Delete the stored record for a site (or an explicit MCP URL). */
export function logout({ site = 'cn', url } = {}) {
  const base = SITES[site]
  if (!url && !base) throw new OAuthError('只支持国内站 cn（https://aitoearn.cn）', { code: 'bad_site' })
  removeRecord(url || `${base}${DEFAULT_MCP_PATH}`)
}

/** Non-secret snapshot for `status`. */
export function describeRecord({ site = 'cn', url } = {}) {
  const base = SITES[site]
  const mcpUrl = url || `${base}${DEFAULT_MCP_PATH}`
  const record = readRecord(mcpUrl)
  if (!record) return { mcpUrl, authorized: false }
  return {
    mcpUrl,
    authorized: Boolean(record.accessToken || record.refreshToken),
    hasAccessToken: Boolean(record.accessToken),
    hasRefreshToken: Boolean(record.refreshToken),
    expiresAt: record.expiresAt || 0,
    expiresAtIso: record.expiresAt ? new Date(record.expiresAt).toISOString() : '',
    scope: record.scope || '',
    issuer: record.issuer || '',
    mcpEndpoint: record.mcpUrl || mcpUrl,
    flow: record.flow || '',
  }
}

/** Live check used by the CLI after login. Never logs the token itself. */
export async function verifyToken(mcpUrl, token) {
  const res = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
  })
  const text = await res.text()
  const events = parseSse(text)
  const payload = events.length ? events[events.length - 1] : safeJson(text)
  const tools = Array.isArray(payload?.result?.tools) ? payload.result.tools : []
  return {
    ok: res.ok && tools.length > 0,
    status: res.status,
    toolCount: tools.length,
    onlyConnectionHelp: tools.length === 1 && tools[0]?.name === 'aitoearn_connection_help',
  }
}

function safeJson(text) {
  try { return JSON.parse(text) } catch { return null }
}

function parseSse(body) {
  const out = []
  for (const block of body.split(/\r?\n\r?\n/)) {
    for (const line of block.split(/\r?\n/)) {
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      const parsed = safeJson(data)
      if (parsed && typeof parsed === 'object') out.push(parsed)
    }
  }
  return out
}
