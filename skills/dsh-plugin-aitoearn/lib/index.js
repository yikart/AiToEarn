// AiToEarn 全域内容运营助手 · DeepSeek Harness 插件
//
// Two responsibilities:
//   1. Register the bundled skills/ directory as a skill provider.
//   2. Own an OAuth-authenticated MCP connection to AiToEarn and register its
//      tools on ctx.tools. Tokens come from ~/.aitoearn/oauth.json and are
//      refreshed automatically; a fresh CLI login is picked up without restart.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTokenProvider, McpAuthError, McpHttpClient } from './mcp.js'
import { storeMtimeMs, SITES, DEFAULT_MCP_PATH } from './oauth.js'
import { syncTools } from './tool-bridge.js'

const PROVIDER_NAME = 'aitoearn-plugin'
const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SKILLS_ROOT = join(PACKAGE_ROOT, 'skills')
const LOGIN_COMMAND = `node ${join(PACKAGE_ROOT, 'scripts', 'aitoearn.mjs')} login`
const RESYNC_INTERVAL_MS = 15_000

// 解析 SKILL.md 的 YAML frontmatter（覆盖本包用到的形态：单行值、>- / > 折叠块）
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return {}
  const out = {}
  let cur = null
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):[ \t]*(.*)$/)
    if (kv) {
      cur = kv[1]
      // A value like ">-" or "|" is a YAML block-scalar header; the real
      // content follows on the indented continuation lines, so start empty.
      out[cur] = /^[>|][+-]?[0-9]?$/.test(kv[2].trim()) ? '' : kv[2]
    } else if (cur && /^[ \t]+\S/.test(line)) {
      out[cur] = (out[cur] ? out[cur] + ' ' : '') + line.trim()
    }
  }
  return out
}

function loadCandidates() {
  const list = []
  let dirs = []
  try { dirs = readdirSync(SKILLS_ROOT) } catch { return list }
  for (const dir of dirs) {
    const file = join(SKILLS_ROOT, dir, 'SKILL.md')
    if (!existsSync(file)) continue
    let raw = ''
    try { raw = readFileSync(file, 'utf8') } catch { continue }
    const fm = parseFrontmatter(raw)
    list.push({
      name: fm.name || dir,
      description: fm.description || '',
      invocation: { modelInvocable: true, userInvocable: true },
      provider: PROVIDER_NAME,
      source: 'bundled',
      resourceBase: { kind: 'directory', path: join(SKILLS_ROOT, dir) },
      rank: 600,
      locator: file,
    })
  }
  return list
}

const provider = {
  name: PROVIDER_NAME,
  list: () => Promise.resolve(loadCandidates()),
  async get(candidate) {
    const name = candidate && candidate.name
    const file = join(SKILLS_ROOT, name, 'SKILL.md')
    const raw = readFileSync(file, 'utf8')
    const fm = parseFrontmatter(raw)
    return {
      name,
      description: fm.description || (candidate && candidate.description) || '',
      invocation: { modelInvocable: true, userInvocable: true },
      provider: PROVIDER_NAME,
      source: 'bundled',
      resourceBase: { kind: 'directory', path: join(SKILLS_ROOT, name) },
      content: raw,
    }
  },
}

function resolveConfig(config) {
  const raw = config && typeof config === 'object' ? config : {}
  const explicitUrl = String(raw.url || process.env.AITOEARN_MCP_URL || '').trim()
  const configuredSite = String(raw.site || process.env.AITOEARN_SITE || 'cn').trim().toLowerCase()
  const site = SITES[configuredSite] ? configuredSite : 'cn'
  return {
    url: explicitUrl || `${SITES[site]}${DEFAULT_MCP_PATH}`,
    serverName: String(raw.serverName || 'aitoearn'),
    site,
  }
}

async function startMcp(ctx, { url, serverName, site }) {
  const log = (level, message) => {
    const fn = ctx.logger?.[level]
    if (typeof fn === 'function') fn.call(ctx.logger, message)
  }
  const loginHint = `${LOGIN_COMMAND} --site ${site}`

  const client = new McpHttpClient({
    url,
    serverName,
    tokenProvider: createTokenProvider(url),
  })
  let disposers = new Map()
  let closed = false
  let lastStoreMtime = storeMtimeMs()
  let warnedAboutLogin = false

  const sync = async (reason) => {
    if (closed) return
    try {
      if (!client.initialized) await client.initialize()
      const next = await syncTools(client, ctx, serverName, disposers)
      if (closed) {
        for (const dispose of next.values()) dispose()
        return
      }
      disposers = next
      if (disposers.size === 0) {
        log('warn', `aitoearn(${serverName}): 未发现可用工具，请完成 OAuth 授权后重试（${loginHint}）`)
      } else {
        log('info', `aitoearn(${serverName}): ${disposers.size} 个工具已就绪（${reason}）`)
      }
      warnedAboutLogin = false
    } catch (error) {
      if (error instanceof McpAuthError) {
        if (!warnedAboutLogin) {
          warnedAboutLogin = true
          log('warn', `aitoearn(${serverName}): OAuth 尚未授权或已过期。运行 ${loginHint}`)
        }
      } else {
        log('error', `aitoearn(${serverName}): 连接 MCP 失败：${String(error?.message || error)}`)
      }
    }
  }

  ctx.effect(() => {
    sync('startup')

    const timer = setInterval(() => {
      if (closed) return
      const mtime = storeMtimeMs()
      if (mtime === lastStoreMtime) return
      lastStoreMtime = mtime
      // A new login (or a refresh) changed the credential file: handshake
      // again so an auth-scoped tool list replaces the anonymous one.
      client.close().then(() => sync('oauth credentials updated'))
    }, RESYNC_INTERVAL_MS)

    return async () => {
      closed = true
      clearInterval(timer)
      for (const dispose of disposers.values()) dispose()
      disposers = new Map()
      await client.close()
    }
  }, 'dsh-plugin-aitoearn.mcp')
}

/** Cordis 插件名（与 cordis.patch.yml 条目一致）。 */
const name = 'dsh-plugin-aitoearn'
/** 技能注册表与工具注册表服务。 */
const inject = ['skills', 'tools']

/** 注册技能提供方，并建立 OAuth 鉴权的 MCP 连接。 */
async function apply(ctx, config) {
  ctx.skills.registerProvider(() => provider)
  const resolved = resolveConfig(config)
  if (!resolved.url) {
    const log = ctx.logger?.warn
    if (typeof log === 'function') {
      log.call(ctx.logger, `aitoearn: 尚未连接国内站。运行 ${LOGIN_COMMAND} ，在 https://aitoearn.cn 完成授权。`)
    }
    return
  }
  await startMcp(ctx, resolved)
}

export { apply, inject, name }
