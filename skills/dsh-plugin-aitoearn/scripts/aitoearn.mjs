#!/usr/bin/env node
// aitoearn-oauth — OAuth 2.1 login helper for the AiToEarn DSH plugin.
//
// Usage:
//   node scripts/aitoearn.mjs login [--url <mcp-url>] [--scope <scope>]
//   node scripts/aitoearn.mjs status [--url <mcp-url>]
//   node scripts/aitoearn.mjs refresh [--url <mcp-url>]
//   node scripts/aitoearn.mjs logout [--url <mcp-url>]
//
// 授权默认使用国内站 https://aitoearn.cn 。
//
// Environment overrides:
//   AITOEARN_OAUTH_STORE, AITOEARN_OAUTH_ISSUER,
//   AITOEARN_OAUTH_AUTHORIZE_URL, AITOEARN_OAUTH_TOKEN_URL,
//   AITOEARN_OAUTH_REGISTRATION_URL, AITOEARN_OAUTH_DEVICE_AUTHORIZATION_URL,
//   AITOEARN_OAUTH_CLIENT_ID, AITOEARN_OAUTH_CLIENT_SECRET,
//   AITOEARN_OAUTH_SCOPE, AITOEARN_OAUTH_CALLBACK_PORT,
//   AITOEARN_OAUTH_OPEN_BROWSER=0, AITOEARN_MCP_URL
//
// Tokens are stored in ~/.aitoearn/oauth.json (0600) and never printed.
import {
  describeRecord,
  getAccessToken,
  login,
  logout,
  OAuthError,
  refreshRecord,
  readRecord,
  resolveEndpoints,
  saveSelectedSite,
  SITES,
  storePath,
  verifyToken,
} from '../lib/oauth.js'

function flag(name, fallback = null) {
  const index = process.argv.indexOf(name)
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback
}

const command = process.argv[2] || 'status'
const url = flag('--url', process.env.AITOEARN_MCP_URL || '') || undefined
const scope = flag('--scope', process.env.AITOEARN_OAUTH_SCOPE || '') || undefined
const site = 'cn'

function mcpUrl() {
  if (url) return url
  const base = SITES[site]
  if (!base) throw new OAuthError('只支持国内站 cn（https://aitoearn.cn）', { code: 'bad_site' })
  return `${base}/api/ai/agent/mcp`
}

async function runLogin() {
  const target = mcpUrl()
  if (site) saveSelectedSite(site)
  console.log(`开始 OAuth 授权：${target}`)
  const endpoints = await resolveEndpoints({ url: target, scope })
  console.log(`授权服务器：${endpoints.issuer}（${endpoints.authorizationEndpoint || 'device flow'}）`)

  const record = await login({
    site,
    url: target,
    scope,
    onPrompt(message) {
      console.log('')
      console.log(message)
      console.log('')
    },
  })

  console.log(`授权成功（${record.flow === 'device_code' ? '设备码' : '授权码 + PKCE'}）。`)
  if (record.expiresAt) console.log(`访问令牌有效期至：${new Date(record.expiresAt).toISOString()}`)
  console.log(`令牌已写入：${storePath()}（权限 600，内容不会显示）`)

  const token = await getAccessToken(target)
  const check = await verifyToken(target, token)
  if (check.onlyConnectionHelp) {
    console.log('警告：服务器仍只返回连接诊断工具，说明该令牌未获得 MCP 工具权限，请确认 scope 或服务端配置。')
  } else if (check.ok) {
    console.log(`验证通过：当前账号可见 ${check.toolCount} 个工具。`)
  } else {
    console.log(`验证未通过：HTTP ${check.status}，可见工具 ${check.toolCount} 个。`)
  }
  console.log('请重新打开或新开一个 DeepSeek Harness 会话以加载工具。')
}

async function runStatus() {
  const target = mcpUrl()
  const summary = describeRecord({ site, url: target })
  console.log(`MCP 端点：${summary.mcpUrl}`)
  if (!summary.authorized) {
    console.log('状态：未授权')
    console.log('运行 login 子命令开始 OAuth 授权。')
    return
  }
  console.log('状态：已授权')
  console.log(`授权方式：${summary.flow === 'device_code' ? '设备码' : '授权码 + PKCE'}`)
  console.log(`访问令牌：${summary.hasAccessToken ? '存在' : '缺失'}`)
  console.log(`刷新令牌：${summary.hasRefreshToken ? '存在' : '缺失'}`)
  if (summary.expiresAtIso) console.log(`到期时间：${summary.expiresAtIso}`)
  if (summary.scope) console.log(`Scope：${summary.scope}`)
  console.log(`令牌存储：${storePath()}`)
}

async function runRefresh() {
  const target = mcpUrl()
  const record = readRecord(target)
  if (!record) throw new OAuthError('尚未授权，无法刷新', { code: 'not_authorized' })
  const refreshed = await refreshRecord(target, record)
  if (!refreshed) throw new OAuthError('没有可用的刷新令牌，请重新登录', { code: 'no_refresh_token' })
  console.log('刷新成功。')
  if (refreshed.expiresAt) console.log(`新的到期时间：${new Date(refreshed.expiresAt).toISOString()}`)
  const check = await verifyToken(target, refreshed.accessToken)
  console.log(check.ok ? `验证通过：可见 ${check.toolCount} 个工具。` : `验证未通过：HTTP ${check.status}。`)
}

function runLogout() {
  const target = mcpUrl()
  logout({ site, url: target })
  console.log(`已删除 ${target} 的本地 OAuth 令牌。`)
}

async function main() {
  switch (command) {
    case 'login':
      await runLogin()
      break
    case 'status':
      await runStatus()
      break
    case 'refresh':
      await runRefresh()
      break
    case 'logout':
      runLogout()
      break
    default:
      console.error(`未知命令 "${command}"，可用：login / status / refresh / logout`)
      process.exitCode = 2
  }
}

main().catch((error) => {
  if (error instanceof OAuthError) {
    console.error(`失败：${error.message}`)
    if (error.code === 'discovery_failed') {
      console.error('可设置 AITOEARN_OAUTH_AUTHORIZE_URL / AITOEARN_OAUTH_TOKEN_URL 显式指定授权端点。')
    }
  } else {
    console.error(`失败：${error?.message || error}`)
  }
  process.exitCode = 1
})
